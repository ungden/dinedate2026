-- =============================================
-- Referral System for DineDate
-- =============================================

-- 1. Add referral columns to users table
DO $$
BEGIN
    -- Add referral_code column (unique, auto-generated)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'referral_code'
    ) THEN
        ALTER TABLE users ADD COLUMN referral_code TEXT UNIQUE;
    END IF;

    -- Add referred_by column (references the referrer's user ID)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'referred_by'
    ) THEN
        ALTER TABLE users ADD COLUMN referred_by UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END
$$;

-- 2. Create referral_rewards table
CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referrer_reward INTEGER NOT NULL DEFAULT 50000, -- 50k VND for referrer
    referred_reward INTEGER NOT NULL DEFAULT 30000, -- 30k VND for new user
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Each referral can only have one reward record
    CONSTRAINT unique_referral_pair UNIQUE (referrer_id, referred_id)
);

-- 3. Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referred ON referral_rewards(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_created_at ON referral_rewards(created_at DESC);

-- 4. Enable RLS on referral_rewards
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for referral_rewards

-- Users can view rewards where they are the referrer
CREATE POLICY "Users can view own referral rewards"
    ON referral_rewards FOR SELECT
    TO authenticated
    USING (auth.uid() = referrer_id);

-- Users can view rewards where they are the referred
CREATE POLICY "Referred users can view their reward"
    ON referral_rewards FOR SELECT
    TO authenticated
    USING (auth.uid() = referred_id);

-- Service role can manage all referral rewards (for edge functions)
CREATE POLICY "Service role can manage all referral rewards"
    ON referral_rewards FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 6. Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    code TEXT := '';
    i INTEGER;
    code_exists BOOLEAN := TRUE;
BEGIN
    -- Keep generating until we find a unique code
    WHILE code_exists LOOP
        code := '';
        -- Generate 8 character code
        FOR i IN 1..8 LOOP
            code := code || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
        END LOOP;

        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO code_exists;
    END LOOP;

    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 7. Function to auto-generate referral code on user insert
CREATE OR REPLACE FUNCTION auto_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate if referral_code is null
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := generate_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger to auto-generate referral code on insert
DROP TRIGGER IF EXISTS user_referral_code_trigger ON users;
CREATE TRIGGER user_referral_code_trigger
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_referral_code();

-- 9. Generate referral codes for existing users who don't have one
UPDATE users
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

-- 10. Function to update updated_at for referral_rewards
CREATE OR REPLACE FUNCTION update_referral_rewards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Trigger for updated_at on referral_rewards
DROP TRIGGER IF EXISTS referral_rewards_updated_at_trigger ON referral_rewards;
CREATE TRIGGER referral_rewards_updated_at_trigger
    BEFORE UPDATE ON referral_rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_referral_rewards_updated_at();

-- 12. Function to process referral when user completes first booking
-- This will be called by edge function
CREATE OR REPLACE FUNCTION process_referral_reward(p_referred_id UUID)
RETURNS JSON AS $$
DECLARE
    v_referrer_id UUID;
    v_reward_id UUID;
    v_referrer_reward INTEGER := 50000;
    v_referred_reward INTEGER := 30000;
    v_reward_record RECORD;
    v_referrer_balance INTEGER;
    v_referred_balance INTEGER;
BEGIN
    -- 1. Check if user was referred
    SELECT referred_by INTO v_referrer_id
    FROM users
    WHERE id = p_referred_id;

    IF v_referrer_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'User was not referred');
    END IF;

    -- 2. Check if reward already processed
    SELECT * INTO v_reward_record
    FROM referral_rewards
    WHERE referred_id = p_referred_id AND referrer_id = v_referrer_id;

    IF v_reward_record.id IS NOT NULL THEN
        IF v_reward_record.status = 'completed' THEN
            RETURN json_build_object('success', false, 'message', 'Reward already processed');
        END IF;
        v_reward_id := v_reward_record.id;
    END IF;

    -- 3. Create or get reward record
    IF v_reward_id IS NULL THEN
        INSERT INTO referral_rewards (referrer_id, referred_id, referrer_reward, referred_reward, status)
        VALUES (v_referrer_id, p_referred_id, v_referrer_reward, v_referred_reward, 'pending')
        RETURNING id INTO v_reward_id;
    END IF;

    -- 4. Add reward to referrer's wallet
    SELECT wallet_balance INTO v_referrer_balance FROM users WHERE id = v_referrer_id;
    UPDATE users SET wallet_balance = COALESCE(v_referrer_balance, 0) + v_referrer_reward WHERE id = v_referrer_id;

    -- 5. Add bonus to referred user's wallet
    SELECT wallet_balance INTO v_referred_balance FROM users WHERE id = p_referred_id;
    UPDATE users SET wallet_balance = COALESCE(v_referred_balance, 0) + v_referred_reward WHERE id = p_referred_id;

    -- 6. Update reward status
    UPDATE referral_rewards
    SET status = 'completed', completed_at = NOW()
    WHERE id = v_reward_id;

    -- 7. Create transaction records
    INSERT INTO transactions (user_id, type, amount, status, description, related_id)
    VALUES
        (v_referrer_id, 'referral_bonus', v_referrer_reward, 'completed', 'Thuong gioi thieu thanh vien moi', v_reward_id),
        (p_referred_id, 'referral_bonus', v_referred_reward, 'completed', 'Thuong dang ky qua gioi thieu', v_reward_id);

    -- 8. Create notifications
    INSERT INTO notifications (user_id, type, title, message, read)
    VALUES
        (v_referrer_id, 'system', 'Thuong gioi thieu', 'Ban nhan duoc ' || v_referrer_reward || 'd tu chuong trinh gioi thieu!', false),
        (p_referred_id, 'system', 'Thuong dang ky', 'Ban nhan duoc ' || v_referred_reward || 'd khi dang ky qua gioi thieu!', false);

    RETURN json_build_object(
        'success', true,
        'referrer_id', v_referrer_id,
        'referred_id', p_referred_id,
        'referrer_reward', v_referrer_reward,
        'referred_reward', v_referred_reward
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Add referral_bonus to transaction types if using constraint
DO $$
BEGIN
    -- Try to update the transactions type constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'transactions_type_check' AND table_name = 'transactions'
    ) THEN
        ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
        ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
            CHECK (type IN ('top_up', 'booking_payment', 'booking_earning', 'vip_payment', 'refund', 'withdrawal', 'escrow_hold', 'escrow_release', 'referral_bonus'));
    END IF;
EXCEPTION
    WHEN others THEN
        -- Constraint might not exist, continue
        NULL;
END
$$;

#!/usr/bin/env node
/**
 * Seed demo data into Supabase for DineDate
 * - 6 restaurants with combos
 * - Demo user account
 * - Active date orders
 */

const SUPABASE_URL = 'https://cgnbicnayzifjyupweki.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnbmJpY25heXppZmp5dXB3ZWtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTAwMDIwMywiZXhwIjoyMDgwNTc2MjAzfQ.pCMEGCwO_1mKV2Y7BwCAAP9SNwvCnzljHsG1t_mr5Gw';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnbmJpY25heXppZmp5dXB3ZWtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMDAyMDMsImV4cCI6MjA4MDU3NjIwM30.2vVLug2ifmdb233-JZcoxUQ_Zs6Ehv7ebB0LKBj6PSc';

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

async function api(table, method, body, query = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  if (!res.ok) {
    console.error(`${method} ${table} → ${res.status}: ${text.substring(0, 300)}`);
    return null;
  }
  return text ? JSON.parse(text) : null;
}

// ========== RESTAURANTS ==========
const restaurants = [
  {
    name: 'Nhà hàng Cơm Niêu Sài Gòn',
    description: 'Nhà hàng cơm niêu truyền thống với không gian ấm cúng, món ăn đậm chất miền Nam. Thích hợp cho buổi hẹn đầu tiên đầy ấn tượng.',
    address: '27 Tú Xương, Phường 7, Quận 3',
    area: 'Quận 3',
    city: 'Hồ Chí Minh',
    cuisine_types: ['Việt Nam', 'Cơm niêu', 'Truyền thống'],
    phone: '028 3930 1234',
    commission_rate: 0.15,
    status: 'active',
    average_rating: 4.5,
    review_count: 128,
    opening_hours: '10:00-22:00',
    max_capacity: 80,
    cover_image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'],
  },
  {
    name: 'La Maison 1888',
    description: 'Nhà hàng Pháp sang trọng tại trung tâm, phục vụ bữa tối lãng mạn với ánh nến và rượu vang hảo hạng.',
    address: '136 Lê Thánh Tôn, Bến Nghé, Quận 1',
    area: 'Quận 1',
    city: 'Hồ Chí Minh',
    cuisine_types: ['Pháp', 'Fine Dining', 'Châu Âu'],
    phone: '028 3823 5678',
    commission_rate: 0.12,
    status: 'active',
    average_rating: 4.8,
    review_count: 256,
    opening_hours: '17:00-23:00',
    max_capacity: 40,
    cover_image_url: 'https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=800',
    images: ['https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=800', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800'],
  },
  {
    name: 'Sushi Hokkaido',
    description: 'Sushi tươi nhập trực tiếp từ Nhật Bản, không gian yên tĩnh kiểu Nhật truyền thống. Lý tưởng cho buổi hẹn tinh tế.',
    address: '15 Lê Quý Đôn, Phường 6, Quận 3',
    area: 'Quận 3',
    city: 'Hồ Chí Minh',
    cuisine_types: ['Nhật Bản', 'Sushi', 'Sashimi'],
    phone: '028 3933 9999',
    commission_rate: 0.13,
    status: 'active',
    average_rating: 4.6,
    review_count: 189,
    opening_hours: '11:00-22:00',
    max_capacity: 50,
    cover_image_url: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=800',
    images: ['https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=800'],
  },
  {
    name: 'Quán Bụi Garden',
    description: 'Không gian xanh mát giữa lòng thành phố, món Việt hiện đại với nguyên liệu organic. Bữa hẹn giữa thiên nhiên.',
    address: '55A Nguyễn Bỉnh Khiêm, Đa Kao, Quận 1',
    area: 'Quận 1',
    city: 'Hồ Chí Minh',
    cuisine_types: ['Việt Nam', 'Organic', 'Sân vườn'],
    phone: '028 3911 5555',
    commission_rate: 0.15,
    status: 'active',
    average_rating: 4.3,
    review_count: 312,
    opening_hours: '09:00-22:30',
    max_capacity: 120,
    cover_image_url: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800',
    images: ['https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800'],
  },
  {
    name: 'Gogi House',
    description: 'Nướng Hàn Quốc chuẩn vị với thịt bò Wagyu, kimchi tự làm. Buổi hẹn nướng vui vẻ, không khoảng cách.',
    address: '180 Hai Bà Trưng, Đa Kao, Quận 1',
    area: 'Quận 1',
    city: 'Hồ Chí Minh',
    cuisine_types: ['Hàn Quốc', 'BBQ', 'Nướng'],
    phone: '028 3820 7777',
    commission_rate: 0.14,
    status: 'active',
    average_rating: 4.2,
    review_count: 445,
    opening_hours: '10:00-23:00',
    max_capacity: 100,
    cover_image_url: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800',
    images: ['https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800'],
  },
  {
    name: 'Pizza 4P\'s Hai Bà Trưng',
    description: 'Pizza thủ công với phô mai tự làm, không gian mở hiện đại. Buổi hẹn casual nhưng vẫn rất ấn tượng.',
    address: '8 Thủ Khoa Huân, Bến Thành, Quận 1',
    area: 'Quận 1',
    city: 'Hồ Chí Minh',
    cuisine_types: ['Ý', 'Pizza', 'Pasta'],
    phone: '028 3622 8888',
    commission_rate: 0.12,
    status: 'active',
    average_rating: 4.7,
    review_count: 567,
    opening_hours: '10:00-22:00',
    max_capacity: 90,
    cover_image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    images: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'],
  },
];

// ========== COMBOS PER RESTAURANT ==========
function getCombos(restaurantId, restaurantIndex) {
  const allCombos = [
    // Restaurant 0: Cơm Niêu
    [
      { name: 'Combo Hẹn Hò Sài Gòn', description: 'Cơm niêu + gà nướng mật ong + canh khổ qua + tráng miệng', items: ['Cơm niêu', 'Gà nướng mật ong', 'Canh khổ qua', 'Chè bưởi'], price: 450000 },
      { name: 'Combo Lãng Mạn Miền Nam', description: 'Cơm niêu + sườn nướng + cá kho tộ + nước dừa', items: ['Cơm niêu đặc biệt', 'Sườn nướng', 'Cá kho tộ', 'Nước dừa tươi'], price: 550000 },
    ],
    // Restaurant 1: La Maison
    [
      { name: 'Combo Dinner Romantique', description: 'Khai vị + bò Wagyu + tráng miệng + rượu vang', items: ['Soup hành Pháp', 'Bò Wagyu áp chảo', 'Crème brûlée', '2 ly rượu vang'], price: 1200000 },
      { name: 'Combo Soirée Parisienne', description: 'Foie gras + cá hồi + chocolate fondant', items: ['Foie gras', 'Cá hồi nướng bơ chanh', 'Chocolate fondant', 'Café espresso'], price: 1500000 },
    ],
    // Restaurant 2: Sushi
    [
      { name: 'Combo Sushi Date', description: 'Set sushi hỗn hợp 20 miếng + miso soup + matcha', items: ['Sushi hỗn hợp 20 miếng', 'Miso soup', 'Edamame', 'Matcha latte'], price: 650000 },
      { name: 'Combo Omakase Đôi', description: 'Set omakase 7 món do chef chọn + sake', items: ['Omakase 7 món', 'Sake Dassai', 'Mochi tráng miệng'], price: 900000 },
    ],
    // Restaurant 3: Quán Bụi
    [
      { name: 'Combo Garden Date', description: 'Gỏi hoa chuối + bò lúc lắc + cơm chiên + sinh tố', items: ['Gỏi hoa chuối', 'Bò lúc lắc', 'Cơm chiên dương châu', 'Sinh tố bơ'], price: 380000 },
      { name: 'Combo Organic Love', description: 'Salad organic + cá điêu hồng + canh chua + trái cây', items: ['Salad organic', 'Cá điêu hồng chiên giòn', 'Canh chua', 'Trái cây tươi'], price: 420000 },
    ],
    // Restaurant 4: Gogi
    [
      { name: 'Combo BBQ Date Night', description: 'Thịt ba chỉ + bò Mỹ + banchan + đồ uống', items: ['Thịt ba chỉ Hàn Quốc', 'Bò Mỹ nướng', 'Banchan 6 món', 'Soju hoặc nước ngọt'], price: 520000 },
      { name: 'Combo Premium Wagyu', description: 'Wagyu A5 + tôm nướng + japchae + kem', items: ['Wagyu A5', 'Tôm nướng bơ tỏi', 'Japchae', 'Kem bingsu'], price: 850000 },
    ],
    // Restaurant 5: Pizza 4P's
    [
      { name: 'Combo Pizza Date', description: 'Pizza burrata + pasta + tiramisu + đồ uống', items: ['Pizza Burrata', 'Pasta Carbonara', 'Tiramisu', '2 ly soda Ý'], price: 480000 },
      { name: 'Combo Italian Night', description: 'Bruschetta + pizza truffle + panna cotta + rượu', items: ['Bruschetta', 'Pizza nấm truffle', 'Panna cotta', '2 ly Prosecco'], price: 680000 },
    ],
  ];
  return allCombos[restaurantIndex].map(c => ({ ...c, restaurant_id: restaurantId, is_available: true }));
}

// ========== MAIN ==========
async function main() {
  console.log('=== Seeding DineDate Demo Data ===\n');

  // 1. Check if restaurants already exist
  const existing = await api('restaurants', 'GET', null, '?select=id&limit=1');
  if (existing && existing.length > 0) {
    console.log('⚠ Restaurants already exist. Clearing old data first...');
    await api('date_orders', 'DELETE', null, '?id=not.is.null');
    await api('combos', 'DELETE', null, '?id=not.is.null');
    await api('restaurants', 'DELETE', null, '?id=not.is.null');
    console.log('✓ Old data cleared');
  }

  // 2. Insert restaurants
  console.log('\n--- Inserting restaurants ---');
  const insertedRestaurants = await api('restaurants', 'POST', restaurants);
  if (!insertedRestaurants) { console.error('Failed to insert restaurants'); process.exit(1); }
  console.log(`✓ Inserted ${insertedRestaurants.length} restaurants`);
  for (const r of insertedRestaurants) {
    console.log(`  - ${r.name} (${r.id.substring(0,8)})`);
  }

  // 3. Insert combos
  console.log('\n--- Inserting combos ---');
  let totalCombos = 0;
  for (let i = 0; i < insertedRestaurants.length; i++) {
    const combos = getCombos(insertedRestaurants[i].id, i);
    const inserted = await api('combos', 'POST', combos);
    if (inserted) {
      totalCombos += inserted.length;
      console.log(`  ✓ ${inserted.length} combos for ${insertedRestaurants[i].name}`);
    }
  }
  console.log(`✓ Total: ${totalCombos} combos`);

  // 4. Create demo user via auth API
  console.log('\n--- Creating demo user ---');
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'demo@dinedate.vn',
      password: 'DineDate2026!',
      email_confirm: true,
      user_metadata: { full_name: 'Người Dùng Demo', gender: 'male', avatar_seed: 'demo-user-2026' },
    }),
  });
  const authData = await authRes.json();
  let demoUserId;
  if (authRes.ok) {
    demoUserId = authData.id;
    console.log(`✓ Created demo user: ${demoUserId}`);
  } else if (authData?.msg?.includes('already') || authData?.message?.includes('already')) {
    console.log('⚠ Demo user already exists, looking up...');
    const lookup = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=50`, {
      headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
    });
    const users = await lookup.json();
    const demoUser = users.users?.find(u => u.email === 'demo@dinedate.vn');
    demoUserId = demoUser?.id;
    console.log(`✓ Found demo user: ${demoUserId}`);
  } else {
    console.error('Failed to create demo user:', JSON.stringify(authData));
  }

  // 5. Update public.users profile for demo user
  if (demoUserId) {
    await api('users', 'PATCH', {
      full_name: 'Người Dùng Demo',
      gender: 'male',
      avatar_seed: 'demo-user-2026',
      bio: 'Tài khoản demo để trải nghiệm DineDate!',
    }, `?id=eq.${demoUserId}`);
    console.log('✓ Updated demo user profile');
  }

  // 6. Create a second demo user for date orders from others
  console.log('\n--- Creating second demo user ---');
  const auth2 = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'user2@dinedate.vn',
      password: 'DineDate2026!',
      email_confirm: true,
      user_metadata: { full_name: 'Minh Anh', gender: 'female', avatar_seed: 'minh-anh-2026' },
    }),
  });
  const auth2Data = await auth2.json();
  let user2Id;
  if (auth2.ok) {
    user2Id = auth2Data.id;
  } else {
    const lookup = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=50`, {
      headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
    });
    const users = await lookup.json();
    user2Id = users.users?.find(u => u.email === 'user2@dinedate.vn')?.id;
  }
  if (user2Id) {
    await api('users', 'PATCH', {
      full_name: 'Minh Anh',
      gender: 'female',
      avatar_seed: 'minh-anh-2026',
      bio: 'Yêu ẩm thực, thích khám phá nhà hàng mới!',
    }, `?id=eq.${user2Id}`);
    console.log(`✓ Second user: ${user2Id}`);
  }

  // 7. Create more users for variety
  const extraUsers = [
    { email: 'user3@dinedate.vn', name: 'Thanh Hương', gender: 'female', seed: 'thanh-huong' },
    { email: 'user4@dinedate.vn', name: 'Đức Anh', gender: 'male', seed: 'duc-anh' },
    { email: 'user5@dinedate.vn', name: 'Thùy Linh', gender: 'female', seed: 'thuy-linh' },
  ];
  const userIds = [demoUserId, user2Id];
  for (const u of extraUsers) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: u.email, password: 'DineDate2026!', email_confirm: true, user_metadata: { full_name: u.name, gender: u.gender, avatar_seed: u.seed } }),
    });
    const d = await r.json();
    const uid = d.id || null;
    if (uid) {
      userIds.push(uid);
      await api('users', 'PATCH', { full_name: u.name, gender: u.gender, avatar_seed: u.seed }, `?id=eq.${uid}`);
      console.log(`✓ Created ${u.name} (${uid.substring(0,8)})`);
    } else {
      // lookup
      const lookup = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=50`, {
        headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
      });
      const users = await lookup.json();
      const found = users.users?.find(x => x.email === u.email);
      if (found) { userIds.push(found.id); console.log(`✓ Found ${u.name}`); }
    }
  }

  // 8. Create date orders
  console.log('\n--- Creating date orders ---');
  // Get all combos
  const allCombos = await api('combos', 'GET', null, '?select=id,restaurant_id,price');

  const now = new Date();
  const dateOrders = [];
  const creators = userIds.filter(Boolean);

  for (let i = 0; i < Math.min(6, insertedRestaurants.length); i++) {
    const restaurant = insertedRestaurants[i];
    const combosForR = allCombos.filter(c => c.restaurant_id === restaurant.id);
    if (combosForR.length === 0) continue;
    const combo = combosForR[0];
    const creator = creators[i % creators.length];
    const dateTime = new Date(now.getTime() + (i + 2) * 24 * 60 * 60 * 1000); // 2-7 days from now
    dateTime.setHours(19, 0, 0, 0);
    const expiresAt = new Date(dateTime.getTime() - 60 * 60 * 1000); // 1h before

    const commission = Math.round(combo.price * restaurant.commission_rate);
    const platformFee = 100000;
    const descriptions = [
      'Tìm bạn ăn tối cuối tuần, thích người vui vẻ, biết nấu ăn càng tốt!',
      'Muốn khám phá nhà hàng mới, ai cùng sở thích ẩm thực Pháp không?',
      'Date nhẹ nhàng, thích nghe nhạc jazz và uống rượu vang.',
      'Tìm người hợp gu ăn uống, mình thích đồ Nhật!',
      'Weekend date nướng BBQ, ai vui tính lên!',
      'Pizza date casual, không áp lực, chỉ cần vui là được.',
    ];

    dateOrders.push({
      creator_id: creator,
      restaurant_id: restaurant.id,
      combo_id: combo.id,
      date_time: dateTime.toISOString(),
      description: descriptions[i],
      preferred_gender: i % 3 === 0 ? 'female' : i % 3 === 1 ? 'male' : null,
      payment_split: ['split', 'creator_pays', 'split'][i % 3],
      combo_price: combo.price,
      platform_fee: platformFee,
      creator_total: Math.round(combo.price / 2) + platformFee,
      applicant_total: Math.round(combo.price / 2) + platformFee,
      restaurant_commission: commission,
      status: 'active',
      max_applicants: 20,
      applicant_count: Math.floor(Math.random() * 5),
      expires_at: expiresAt.toISOString(),
    });
  }

  const insertedOrders = await api('date_orders', 'POST', dateOrders);
  if (insertedOrders) {
    console.log(`✓ Created ${insertedOrders.length} date orders`);
    for (const o of insertedOrders) {
      const r = insertedRestaurants.find(r => r.id === o.restaurant_id);
      console.log(`  - ${r?.name}: ${new Date(o.date_time).toLocaleDateString('vi-VN')} (${o.status})`);
    }
  }

  // 9. Add wallet balance for demo user
  if (demoUserId) {
    console.log('\n--- Adding wallet balance ---');
    await api('wallet_transactions', 'POST', {
      user_id: demoUserId,
      type: 'topup',
      amount: 2000000,
      description: 'Nạp tiền demo',
      status: 'completed',
    });
    console.log('✓ Added 2,000,000₫ to demo wallet');
  }

  console.log('\n=== Demo data seeded successfully! ===');
  console.log(`\nDemo login: demo@dinedate.vn / DineDate2026!`);
  console.log(`Restaurants: ${insertedRestaurants.length}`);
  console.log(`Combos: ${totalCombos}`);
  console.log(`Date orders: ${dateOrders.length}`);
  console.log(`Users: ${userIds.filter(Boolean).length}`);
}

main().catch(console.error);

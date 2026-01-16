import { motion as framerMotion, HTMLMotionProps, AnimatePresence as FramerAnimatePresence, LayoutGroup as FramerLayoutGroup } from 'framer-motion';
import { ComponentProps } from 'react';

// Type-safe motion components that properly handle HTML attributes
type MotionDivProps = HTMLMotionProps<'div'> & ComponentProps<'div'>;
type MotionButtonProps = HTMLMotionProps<'button'> & ComponentProps<'button'>;
type MotionSpanProps = HTMLMotionProps<'span'> & ComponentProps<'span'>;
type MotionMainProps = HTMLMotionProps<'main'> & ComponentProps<'main'>;
type MotionNavProps = HTMLMotionProps<'nav'> & ComponentProps<'nav'>;
type MotionLiProps = HTMLMotionProps<'li'> & ComponentProps<'li'>;
type MotionUlProps = HTMLMotionProps<'ul'> & ComponentProps<'ul'>;
type MotionH1Props = HTMLMotionProps<'h1'> & ComponentProps<'h1'>;
type MotionH2Props = HTMLMotionProps<'h2'> & ComponentProps<'h2'>;
type MotionH3Props = HTMLMotionProps<'h3'> & ComponentProps<'h3'>;
type MotionPProps = HTMLMotionProps<'p'> & ComponentProps<'p'>;
type MotionAProps = HTMLMotionProps<'a'> & ComponentProps<'a'>;
type MotionSectionProps = HTMLMotionProps<'section'> & ComponentProps<'section'>;
type MotionArticleProps = HTMLMotionProps<'article'> & ComponentProps<'article'>;
type MotionHeaderProps = HTMLMotionProps<'header'> & ComponentProps<'header'>;
type MotionFooterProps = HTMLMotionProps<'footer'> & ComponentProps<'footer'>;
type MotionImgProps = HTMLMotionProps<'img'> & ComponentProps<'img'>;
type MotionInputProps = HTMLMotionProps<'input'> & ComponentProps<'input'>;
type MotionFormProps = HTMLMotionProps<'form'> & ComponentProps<'form'>;
type MotionSvgProps = HTMLMotionProps<'svg'> & ComponentProps<'svg'>;
type MotionCircleProps = HTMLMotionProps<'circle'> & ComponentProps<'circle'>;
type MotionPathProps = HTMLMotionProps<'path'> & ComponentProps<'path'>;
type MotionLabelProps = HTMLMotionProps<'label'> & ComponentProps<'label'>;
type MotionTextareaProps = HTMLMotionProps<'textarea'> & ComponentProps<'textarea'>;

// Re-export motion with better types
export const motion = {
    div: framerMotion.div as React.FC<MotionDivProps>,
    button: framerMotion.button as React.FC<MotionButtonProps>,
    span: framerMotion.span as React.FC<MotionSpanProps>,
    main: framerMotion.main as React.FC<MotionMainProps>,
    nav: framerMotion.nav as React.FC<MotionNavProps>,
    li: framerMotion.li as React.FC<MotionLiProps>,
    ul: framerMotion.ul as React.FC<MotionUlProps>,
    h1: framerMotion.h1 as React.FC<MotionH1Props>,
    h2: framerMotion.h2 as React.FC<MotionH2Props>,
    h3: framerMotion.h3 as React.FC<MotionH3Props>,
    p: framerMotion.p as React.FC<MotionPProps>,
    a: framerMotion.a as React.FC<MotionAProps>,
    section: framerMotion.section as React.FC<MotionSectionProps>,
    article: framerMotion.article as React.FC<MotionArticleProps>,
    header: framerMotion.header as React.FC<MotionHeaderProps>,
    footer: framerMotion.footer as React.FC<MotionFooterProps>,
    img: framerMotion.img as React.FC<MotionImgProps>,
    input: framerMotion.input as React.FC<MotionInputProps>,
    form: framerMotion.form as React.FC<MotionFormProps>,
    svg: framerMotion.svg as React.FC<MotionSvgProps>,
    circle: framerMotion.circle as React.FC<MotionCircleProps>,
    path: framerMotion.path as React.FC<MotionPathProps>,
    label: framerMotion.label as React.FC<MotionLabelProps>,
    textarea: framerMotion.textarea as React.FC<MotionTextareaProps>,
};

// Re-export everything else from framer-motion
export const AnimatePresence = FramerAnimatePresence;
export const LayoutGroup = FramerLayoutGroup;
export type { Variants } from 'framer-motion';

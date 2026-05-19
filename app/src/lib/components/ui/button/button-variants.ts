import { type VariantProps, tv } from 'tailwind-variants';

export const buttonVariants = tv({
  base: 'ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border-input bg-background hover:bg-accent hover:text-accent-foreground border',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    },
    size: {
      default: 'h-11 min-h-[44px] px-4 py-2',
      sm: 'h-9 min-h-[36px] rounded-md px-3',
      lg: 'h-12 min-h-[48px] rounded-md px-8',
      icon: 'h-11 w-11 min-h-[44px] min-w-[44px]',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export type Variant = VariantProps<typeof buttonVariants>['variant'];
export type Size = VariantProps<typeof buttonVariants>['size'];

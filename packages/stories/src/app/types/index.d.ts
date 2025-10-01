import { Icons } from "@/components/icons";

export type NavItem = {
    title: string;
    href: string;
    disabled?: boolean;
};

export type MainNavItem = NavItem;

export type SidebarNavItem = {
    title: string;
    disabled?: boolean;
    external?: boolean;
    icon?: keyof typeof Icons;
    label?: string;
} & (
    | {
          href: string;
          items?: never;
      }
    | {
          href?: string;
          items: SidebarNavItem[];
      }
);

export type SiteConfig = {
    name: string;
    description: string;
    url: string;
    links: {
        github: string;
    };
    mainNav: MainNavItem[];
};

export type DocsConfig = {
    sidebarNav: SidebarNavItem[];
};

export type DashboardConfig = {
    mainNav: MainNavItem[];
    sidebarNav: SidebarNavItem[];
};

export type SubscriptionPlan = {
    name: string;
    description: string;
    stripePriceId: string;
};

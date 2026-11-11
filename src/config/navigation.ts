export interface NavItem {
  title: string;
  href: string;
  key?: string;
}

export const mainNavConfig: NavItem[] = [
  {
    title: "Bosh sahifa",
    href: "/",
    key: "home",
  },
  {
    title: "Talabalar uchun",
    href: "/academic",
    key: "students",
  },
  {
    title: "Rasm tashlash",
    href: "/academic/referat?mode=image",
    key: "imageTopics",
  },
  {
    title: "Xizmatlar",
    href: "/tools",
    key: "services",
  },
  {
    title: "Narxlar",
    href: "/pricing",
    key: "pricing",
  },
  {
    title: "Yordam",
    href: "/#faq",
    key: "help",
  },
];

export interface NavItem {
  title: string;
  href: string;
}

export const mainNavConfig: NavItem[] = [
  {
    title: "AI bilan aloqa",
    href: "/chat",
  },
  {
    title: "Kurs ishi uchun",
    href: "/coursework",
  },
  {
    title: "Asboblar",
    href: "/tools",
  },
  {
    title: "Shablonlar",
    href: "/dashboard/templates",
  },
  {
    title: "Tariflar",
    href: "/pricing",
  },
  {
    title: "FAQ",
    href: "/#faq",
  },
];

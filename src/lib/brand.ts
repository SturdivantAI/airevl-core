/**
 * Brand config loader
 * Source of truth: /config/brand.json
 * Rule (blueprint §3 + Phase 3 directive): ALL frontend layout components
 * requiring contact info, social anchors, or legal compliance badges MUST
 * import from this module. No hardcoded text strings allowed.
 */

import brandData from "../../config/brand.json";

export interface SocialMedia {
  x: string;
  tiktok: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  youtube: string;
  whatsapp_business: string;
}

export interface Legal {
  compliance: string[];
  cac_registration_placeholder: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface Nav {
  marketing_links: NavLink[];
  cta_label: string;
  cta_href: string;
}

export interface ConsoleBrand {
  demo_banner_text: string;
  back_to_site_label: string;
  back_to_site_href: string;
}

export interface DemoCard {
  title: string;
  description: string;
  href: string;
  icon: string;
  status: "live" | "coming-soon";
}

export interface DemoHub {
  title: string;
  subtitle: string;
  cards: DemoCard[];
}

export interface StubPage {
  title: string;
  body: string;
}

export interface Stubs {
  solutions: StubPage;
  about: StubPage;
  contact: StubPage;
}

export interface Brand {
  company_name: string;
  corporate_email: string;
  website_url: string;
  social_media: SocialMedia;
  regulatory_focus: string[];
  legal: Legal;
  lockup_descriptor: string;
  tagline: string;
  hero_headline: string;
  nav: Nav;
  console: ConsoleBrand;
  demo_hub: DemoHub;
  stubs: Stubs;
}

const brand = brandData as Brand;

export default brand;

// Named exports for convenience
export const companyName        = brand.company_name;
export const corporateEmail     = brand.corporate_email;
export const websiteUrl         = brand.website_url;
export const socialMedia        = brand.social_media;
export const regulatoryFocus    = brand.regulatory_focus;
export const legal              = brand.legal;
export const lockupDescriptor   = brand.lockup_descriptor;
export const tagline            = brand.tagline;
export const heroHeadline       = brand.hero_headline;
export const cacPlaceholder     = brand.legal.cac_registration_placeholder;
export const nav                = brand.nav;
export const consoleBrand       = brand.console;
export const demoHub            = brand.demo_hub;
export const stubs              = brand.stubs;

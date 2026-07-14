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

export interface Brand {
  company_name: string;
  corporate_email: string;
  website_url: string;
  social_media: SocialMedia;
  regulatory_focus: string[];
  legal: Legal;
  hero_headline: string;
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
export const heroHeadline       = brand.hero_headline;
export const cacPlaceholder     = brand.legal.cac_registration_placeholder;

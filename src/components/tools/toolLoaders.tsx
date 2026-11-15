"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import ToolSkeleton from "@/components/tools/ToolSkeleton";


/**
 * Per-slug lazy entry points.
 *
 * Every tool component lives in its own module behind `next/dynamic`, so
 * /tools/word-counter ships the word counter and NOT the other 55 tools. Before
 * this split one ~240 KB chunk containing all tools loaded on every page.
 *
 * `getToolComponent` is a plain switch (no React hooks) so a server component
 * can resolve the loader statically at build time — the dynamic import then
 * starts in the same render pass as the page, not after hydration.
 */

const loading = () => ToolSkeleton();


const Impl_seoanalyzer = dynamic(() => import("@/components/tools/impl/seo-analyzer"), { loading });
const Impl_metataggenerator = dynamic(() => import("@/components/tools/impl/meta-tag-generator"), { loading });
const Impl_serppreview = dynamic(() => import("@/components/tools/impl/serp-preview"), { loading });
const Impl_socialtagchecker = dynamic(() => import("@/components/tools/impl/social-tag-checker"), { loading });
const Impl_headinganalyzer = dynamic(() => import("@/components/tools/impl/heading-analyzer"), { loading });
const Impl_robotstxtchecker = dynamic(() => import("@/components/tools/impl/robots-txt-checker"), { loading });
const Impl_sitemapchecker = dynamic(() => import("@/components/tools/impl/sitemap-checker"), { loading });
const Impl_schemagenerator = dynamic(() => import("@/components/tools/impl/schema-generator"), { loading });
const Impl_keyworddensitychecker = dynamic(() => import("@/components/tools/impl/keyword-density-checker"), { loading });
const Impl_canonicalchecker = dynamic(() => import("@/components/tools/impl/canonical-checker"), { loading });
const Impl_imageseochecker = dynamic(() => import("@/components/tools/impl/image-seo-checker"), { loading });
const Impl_urlsluganalyzer = dynamic(() => import("@/components/tools/impl/url-slug-analyzer"), { loading });
const Impl_imageresizer = dynamic(() => import("@/components/tools/impl/image-resizer"), { loading });
const Impl_imagecompressor = dynamic(() => import("@/components/tools/impl/image-compressor"), { loading });
const Impl_imagetopdf = dynamic(() => import("@/components/tools/impl/image-to-pdf"), { loading });
const Impl_imageformatconverter = dynamic(() => import("@/components/tools/impl/image-format-converter"), { loading });
const Impl_imagetobase64 = dynamic(() => import("@/components/tools/impl/image-to-base64"), { loading });
const Impl_urlencoder = dynamic(() => import("@/components/tools/impl/url-encoder"), { loading });
const Impl_keyworddensity = dynamic(() => import("@/components/tools/impl/keyword-density"), { loading });
const Impl_imagecrop = dynamic(() => import("@/components/tools/impl/image-crop"), { loading });
const Impl_labourinsurance = dynamic(() => import("@/components/tools/impl/labour-insurance"), { loading });
const Impl_labourovertime = dynamic(() => import("@/components/tools/impl/labour-overtime"), { loading });
const Impl_labourleavepay = dynamic(() => import("@/components/tools/impl/labour-leave-pay"), { loading });
const Impl_labourmahr = dynamic(() => import("@/components/tools/impl/labour-mahr"), { loading });
const Impl_labourvat = dynamic(() => import("@/components/tools/impl/labour-vat"), { loading });
const Impl_labourprofitmargin = dynamic(() => import("@/components/tools/impl/labour-profit-margin"), { loading });
const Impl_labourhiringcost = dynamic(() => import("@/components/tools/impl/labour-hiring-cost"), { loading });
const Impl_labourlatepayment = dynamic(() => import("@/components/tools/impl/labour-late-payment"), { loading });
const Impl_docinvoice = dynamic(() => import("@/components/tools/impl/doc-invoice"), { loading });
const Impl_docresume = dynamic(() => import("@/components/tools/impl/doc-resume"), { loading });
const Impl_docletter = dynamic(() => import("@/components/tools/impl/doc-letter"), { loading });
const Impl_doclease = dynamic(() => import("@/components/tools/impl/doc-lease"), { loading });
const Impl_docexperience = dynamic(() => import("@/components/tools/impl/doc-experience"), { loading });
const Impl_addresstransliterator = dynamic(() => import("@/components/tools/impl/address-transliterator"), { loading });
const Impl_pdfencrypt = dynamic(() => import("@/components/tools/impl/pdf-encrypt"), { loading });
const Impl_pdfdecrypt = dynamic(() => import("@/components/tools/impl/pdf-decrypt"), { loading });
const Impl_pdftextextractor = dynamic(() => import("@/components/tools/impl/pdf-text-extractor"), { loading });
const Impl_iranianValidators = dynamic(() => import("@/components/tools/impl/iranian-validators"), { loading });

const Impl_wordcounter = dynamic(() => import("@/components/tools/impl/word-counter"), { loading });
const Impl_charactercounter = dynamic(() => import("@/components/tools/impl/character-counter"), { loading });
const Impl_persiannumberconverter = dynamic(() => import("@/components/tools/impl/persian-number-converter"), { loading });
const Impl_persiantextcleaner = dynamic(() => import("@/components/tools/impl/persian-text-cleaner"), { loading });
const Impl_numbertowords = dynamic(() => import("@/components/tools/impl/number-to-words"), { loading });
const Impl_percentagecalculator = dynamic(() => import("@/components/tools/impl/percentage-calculator"), { loading });
const Impl_discountcalculator = dynamic(() => import("@/components/tools/impl/discount-calculator"), { loading });
const Impl_pdftoimage = dynamic(() => import("@/components/tools/impl/pdf-to-image"), { loading });
const Impl_pdfcompressor = dynamic(() => import("@/components/tools/impl/pdf-compressor"), { loading });
const Impl_pdfmerger = dynamic(() => import("@/components/tools/impl/pdf-merger"), { loading });
const Impl_profilepicture = dynamic(() => import("@/components/tools/impl/profile-picture"), { loading });
const Impl_loancalculator = dynamic(() => import("@/components/tools/impl/loan-calculator"), { loading });
const Impl_bmicalculator = dynamic(() => import("@/components/tools/impl/bmi-calculator"), { loading });
const Impl_exactage = dynamic(() => import("@/components/tools/impl/exact-age"), { loading });
const Impl_qrcodegenerator = dynamic(() => import("@/components/tools/impl/qr-code-generator"), { loading });
const Impl_jsonformatter = dynamic(() => import("@/components/tools/impl/json-formatter"), { loading });
const Impl_base64encoder = dynamic(() => import("@/components/tools/impl/base64-encoder"), { loading });
const Impl_duplicatelineremover = dynamic(() => import("@/components/tools/impl/duplicate-line-remover"), { loading });
const Impl_linesorter = dynamic(() => import("@/components/tools/impl/line-sorter"), { loading });
const Impl_sluggenerator = dynamic(() => import("@/components/tools/impl/slug-generator"), { loading });
const Impl_dateconverter = dynamic(() => import("@/components/tools/impl/date-converter"), { loading });
const Impl_unitconverter = dynamic(() => import("@/components/tools/impl/unit-converter"), { loading });
const Impl_bankinterest = dynamic(() => import("@/components/tools/impl/bank-interest"), { loading });
const Impl_heictojpg = dynamic(() => import("@/components/tools/impl/heic-to-jpg"), { loading });
const Impl_pdfsplit = dynamic(() => import("@/components/tools/impl/pdf-split"), { loading });
const Impl_jwtdecoder = dynamic(() => import("@/components/tools/impl/jwt-decoder"), { loading });
const Impl_hashgenerator = dynamic(() => import("@/components/tools/impl/hash-generator"), { loading });
const Impl_videocompressor = dynamic(() => import("@/components/tools/impl/video-compressor"), { loading });
const Impl_videotogif = dynamic(() => import("@/components/tools/impl/video-to-gif"), { loading });
const Impl_videotoaudio = dynamic(() => import("@/components/tools/impl/video-to-audio"), { loading });
const Impl_videotrimmer = dynamic(() => import("@/components/tools/impl/video-trimmer"), { loading });
const Impl_videoresizer = dynamic(() => import("@/components/tools/impl/video-resizer"), { loading });
const Impl_salarytax = dynamic(() => import("@/components/tools/impl/salary-tax"), { loading });
const Impl_timestampconverter = dynamic(() => import("@/components/tools/impl/timestamp-converter"), { loading });
const Impl_csvjson = dynamic(() => import("@/components/tools/impl/csv-json"), { loading });
const Impl_colorpicker = dynamic(() => import("@/components/tools/impl/color-picker"), { loading });
const Impl_findreplace = dynamic(() => import("@/components/tools/impl/find-replace"), { loading });
const Impl_passwordgenerator = dynamic(() => import("@/components/tools/impl/password-generator"), { loading });
const Impl_persianlorem = dynamic(() => import("@/components/tools/impl/persian-lorem"), { loading });
const Impl_pdfreorder = dynamic(() => import("@/components/tools/impl/pdf-reorder"), { loading });
const Impl_pdfwatermark = dynamic(() => import("@/components/tools/impl/pdf-watermark"), { loading });
const Impl_favicongenerator = dynamic(() => import("@/components/tools/impl/favicon-generator"), { loading });

/**
 * The remaining Iranian validators (national ID) share one lazily-loaded
 * component, so they are resolved through a small registry.
 *  * by which field they show, so they are resolved through a small registry
 * instead of six near-identical modules.
 */
const validatorKinds = [
  "national-id",
] as const;

type ValidatorKind = (typeof validatorKinds)[number];

function validatorComponent(kind: ValidatorKind) {
  return function IranianValidatorForKind() {
    return <Impl_iranianValidators kind={kind} />;
  };
}

const validatorComponents: Record<string, ComponentType> = Object.fromEntries(
  validatorKinds.map((kind) => [kind, validatorComponent(kind)]),
);

export function getToolComponent(slug: string): ComponentType | null {
  switch (slug) {
    case "word-counter":
      return Impl_wordcounter;
    case "character-counter":
      return Impl_charactercounter;
    case "persian-number-converter":
      return Impl_persiannumberconverter;
    case "persian-text-cleaner":
      return Impl_persiantextcleaner;
    case "number-to-words":
      return Impl_numbertowords;
    case "percentage-calculator":
      return Impl_percentagecalculator;
    case "discount-calculator":
      return Impl_discountcalculator;
    case "image-resizer":
      return Impl_imageresizer;
    case "image-compressor":
      return Impl_imagecompressor;
    case "image-to-pdf":
      return Impl_imagetopdf;
    case "pdf-to-image":
      return Impl_pdftoimage;
    case "pdf-compressor":
      return Impl_pdfcompressor;
    case "pdf-merger":
      return Impl_pdfmerger;
    case "image-format-converter":
      return Impl_imageformatconverter;
    case "image-to-base64":
      return Impl_imagetobase64;
    case "profile-picture":
      return Impl_profilepicture;
    case "loan-calculator":
      return Impl_loancalculator;
    case "bmi-calculator":
      return Impl_bmicalculator;
    case "exact-age":
      return Impl_exactage;
    case "qr-code-generator":
      return Impl_qrcodegenerator;
    case "json-formatter":
      return Impl_jsonformatter;
    case "base64-encoder":
      return Impl_base64encoder;
    case "url-encoder":
      return Impl_urlencoder;
    case "duplicate-line-remover":
      return Impl_duplicatelineremover;
    case "line-sorter":
      return Impl_linesorter;
    case "keyword-density":
      return Impl_keyworddensity;
    case "slug-generator":
      return Impl_sluggenerator;
    case "date-converter":
      return Impl_dateconverter;
    case "labour-insurance":
      return Impl_labourinsurance;
    case "labour-overtime":
      return Impl_labourovertime;
    case "labour-leave-pay":
      return Impl_labourleavepay;
    case "labour-mahr":
      return Impl_labourmahr;
    case "labour-vat":
      return Impl_labourvat;
    case "labour-profit-margin":
      return Impl_labourprofitmargin;
    case "labour-hiring-cost":
      return Impl_labourhiringcost;
    case "labour-late-payment":
      return Impl_labourlatepayment;
    case "doc-invoice":
      return Impl_docinvoice;
    case "doc-resume":
      return Impl_docresume;
    case "doc-letter":
      return Impl_docletter;
    case "doc-lease":
      return Impl_doclease;
    case "doc-experience":
      return Impl_docexperience;
    case "address-transliterator":
      return Impl_addresstransliterator;
    case "pdf-encrypt":
      return Impl_pdfencrypt;
    case "pdf-decrypt":
      return Impl_pdfdecrypt;
    case "pdf-text-extractor":
      return Impl_pdftextextractor;
    case "unit-converter":
      return Impl_unitconverter;
    case "bank-interest":
      return Impl_bankinterest;
    case "heic-to-jpg":
      return Impl_heictojpg;
    case "pdf-split":
      return Impl_pdfsplit;
    case "jwt-decoder":
      return Impl_jwtdecoder;
    case "hash-generator":
      return Impl_hashgenerator;
    case "video-compressor":
      return Impl_videocompressor;
    case "video-to-gif":
      return Impl_videotogif;
    case "video-to-audio":
      return Impl_videotoaudio;
    case "video-trimmer":
      return Impl_videotrimmer;
    case "video-resizer":
      return Impl_videoresizer;
    case "salary-tax":
      return Impl_salarytax;
    case "image-crop":
      return Impl_imagecrop;
    case "timestamp-converter":
      return Impl_timestampconverter;
    case "csv-json":
      return Impl_csvjson;
    case "color-picker":
      return Impl_colorpicker;
    case "find-replace":
      return Impl_findreplace;
    case "password-generator":
      return Impl_passwordgenerator;
    case "persian-lorem":
      return Impl_persianlorem;
    case "pdf-reorder":
      return Impl_pdfreorder;
    case "pdf-watermark":
      return Impl_pdfwatermark;
    case "favicon-generator":
      return Impl_favicongenerator;
    case "seo-analyzer":
      return Impl_seoanalyzer;
    case "meta-tag-generator":
      return Impl_metataggenerator;
    case "serp-preview":
      return Impl_serppreview;
    case "social-tag-checker":
      return Impl_socialtagchecker;
    case "heading-analyzer":
      return Impl_headinganalyzer;
    case "robots-txt-checker":
      return Impl_robotstxtchecker;
    case "sitemap-checker":
      return Impl_sitemapchecker;
    case "schema-generator":
      return Impl_schemagenerator;
    case "keyword-density-checker":
      return Impl_keyworddensitychecker;
    case "canonical-checker":
      return Impl_canonicalchecker;
    case "image-seo-checker":
      return Impl_imageseochecker;
    case "url-slug-analyzer":
      return Impl_urlsluganalyzer;
    case "national-id-validator":
      return validatorComponents["national-id"] ?? null;
    default:
      return null;
  }
}

"use client";
import { useAuth } from "@/context/AuthContext";
import LogoIcon from "@/public/images/logoicon.png";
import AllCardsImage from "@/public/images/all-card.png";
import { WHATSAPP_SUPPORT_NUMBER } from "@/utils/constants";
import {
  Building2,
  Clock,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Twitter,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import PolicyContent from "./PolicyContent";
import TermsContent from "./TermsContent";

const Footer = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isHelpCenterModalOpen, setIsHelpCenterModalOpen] = useState(false);

  const handleToggleTermsModal = () => setIsTermsModalOpen(!isTermsModalOpen);
  const handleTogglePrivacyModal = () =>
    setIsPrivacyModalOpen(!isPrivacyModalOpen);
  const handleToggleHelpCenterModal = () =>
    setIsHelpCenterModalOpen(!isHelpCenterModalOpen);

  const handleWhatsAppHelp = () => {
    setIsHelpCenterModalOpen(true);
  };

  const handleOptionSelect = (type: "buyer" | "supplier") => {
    const phoneNumber = WHATSAPP_SUPPORT_NUMBER.replace(/[\s\-+]/g, "");
    const messageText =
      type === "buyer"
        ? t("hello_i_need_help_buyer") || "Hello, I need help as a buyer"
        : t("hello_i_need_help_supplier") || "Hello, I need help as a supplier";
    const message = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setIsHelpCenterModalOpen(false);
  };

  const socialLinks = [
    { Icon: Facebook, label: "Facebook", href: "#" },
    { Icon: Twitter, label: "Twitter", href: "#" },
    { Icon: Instagram, label: "Instagram", href: "#" },
    { Icon: Linkedin, label: "LinkedIn", href: "#" },
  ];

  const linkClass =
    "text-sm text-[var(--brand-dark-fg)]/60 hover:text-[var(--brand-dark-fg)] transition-colors duration-200 inline-block";

  const headingClass =
    "mb-5 text-sm font-bold tracking-wider text-white uppercase";

  return (
    <footer className="mt-16 w-full bg-[var(--brand-dark)] text-[var(--brand-dark-fg)]/70">
      <div className="container mx-auto px-4 py-14 sm:px-6 md:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-4">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 p-2 backdrop-blur-sm">
                <Image
                  src={LogoIcon}
                  alt="Ultrasooq"
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain"
                />
              </div>
              <span className="text-2xl font-bold text-white">Ultrasooq</span>
            </div>
            <p
              className="mb-6 max-w-sm text-sm leading-relaxed text-[var(--brand-dark-fg)]/60"
              dir={langDir}
            >
              {t("your_trusted_marketplace_for_quality_products")}
            </p>
            <div className="flex gap-2.5">
              {socialLinks.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="hover:bg-primary hover:text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-[var(--brand-dark-fg)]/70 transition-all duration-200 hover:scale-110"
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h3 className={headingClass} translate="no">
              {t("quick_links")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Button
                  variant="link"
                  onClick={handleTogglePrivacyModal}
                  className={`h-auto justify-start p-0 font-normal ${linkClass}`}
                  dir={langDir}
                  translate="no"
                >
                  {t("policy")}
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  onClick={handleToggleTermsModal}
                  className={`h-auto justify-start p-0 font-normal ${linkClass}`}
                  translate="no"
                >
                  {t("term_n_condition")}
                </Button>
              </li>
              <li>
                <Link href="#" className={linkClass} translate="no">
                  {t("shipping")}
                </Link>
              </li>
              <li>
                <Link href="#" className={linkClass} translate="no">
                  {t("return")}
                </Link>
              </li>
              <li>
                <Link href="#" className={linkClass} translate="no">
                  {t("faqs")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="lg:col-span-2">
            <h3 className={headingClass} translate="no">
              {t("company")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className={linkClass} translate="no">
                  {t("about_us")}
                </Link>
              </li>
              <li>
                <Link href="#" className={linkClass} translate="no">
                  {t("affiliate")}
                </Link>
              </li>
              <li>
                <Link href="#" className={linkClass} translate="no">
                  {t("career")}
                </Link>
              </li>
              <li>
                <Link href="#" className={linkClass} translate="no">
                  {t("our_press")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact / Get in Touch */}
          <div className="lg:col-span-4">
            <h3 className={headingClass} translate="no">
              {t("get_in_touch")}
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="bg-primary/15 text-primary mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p
                    className="text-xs font-semibold tracking-wider text-white/70 uppercase"
                    translate="no"
                  >
                    {t("address")}
                  </p>
                  <p
                    className="text-sm text-[var(--brand-dark-fg)]/70"
                    translate="no"
                  >
                    {t("address_value")}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-primary/15 text-primary mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p
                    className="text-xs font-semibold tracking-wider text-white/70 uppercase"
                    translate="no"
                  >
                    {t("email")}
                  </p>
                  <a
                    href={`mailto:${t("email_address_value")}`}
                    className="hover:text-primary text-sm text-[var(--brand-dark-fg)]/70 transition-colors"
                    translate="no"
                  >
                    {t("email_address_value")}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-primary/15 text-primary mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p
                    className="text-xs font-semibold tracking-wider text-white/70 uppercase"
                    translate="no"
                  >
                    {t("phone")}
                  </p>
                  <a
                    href={`tel:${t("phone_value").replace(/\s/g, "")}`}
                    className="hover:text-primary text-sm text-[var(--brand-dark-fg)]/70 transition-colors"
                    translate="no"
                  >
                    {t("phone_value")}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-primary/15 text-primary mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p
                    className="text-xs font-semibold tracking-wider text-white/70 uppercase"
                    translate="no"
                  >
                    {t("working_hours")}
                  </p>
                  <p
                    className="text-sm text-[var(--brand-dark-fg)]/70"
                    translate="no"
                  >
                    {t("working_hours_value")}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p
              className="text-center text-sm text-[var(--brand-dark-fg)]/60 md:text-start"
              dir={langDir}
              translate="no"
            >
              © {new Date().getFullYear()} Ultrasooq.{" "}
              {t("all_rights_reserved")}
            </p>

            <Button
              variant="link"
              onClick={handleWhatsAppHelp}
              className="hover:text-success flex items-center gap-2 text-sm font-normal text-[var(--brand-dark-fg)]/70 transition-colors duration-200"
              translate="no"
            >
              <MessageCircle className="h-4 w-4" />
              {t("help_center")}
            </Button>

            <div className="flex items-center gap-3">
              <p
                className="text-sm text-[var(--brand-dark-fg)]/60"
                dir={langDir}
                translate="no"
              >
                {t("payment_info")}:
              </p>
              <Image
                src={AllCardsImage}
                alt="Accepted payment methods: Visa, Mastercard, and more"
                width={180}
                height={20}
                className="opacity-80"
              />
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isTermsModalOpen} onOpenChange={handleToggleTermsModal}>
        <DialogContent className="md:max-w-4xl!">
          <DialogHeader className="border-light-gray border-b pb-3">
            <DialogTitle className="text-center" dir={langDir} translate="no">
              {t("terms_of_use")}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-color-dark max-h-[500px] min-h-[300px] overflow-y-auto pe-2 text-sm leading-7 font-normal">
            <TermsContent />
          </DialogDescription>
        </DialogContent>
      </Dialog>

      <Dialog open={isPrivacyModalOpen} onOpenChange={handleTogglePrivacyModal}>
        <DialogContent className="md:max-w-4xl!">
          <DialogHeader className="border-light-gray border-b pb-3">
            <DialogTitle className="text-center" dir={langDir} translate="no">
              {t("privacy_policy")}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-color-dark max-h-[500px] min-h-[300px] overflow-y-auto pe-2 text-sm leading-7 font-normal">
            <PolicyContent />
          </DialogDescription>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isHelpCenterModalOpen}
        onOpenChange={handleToggleHelpCenterModal}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle
              className="text-center text-xl font-semibold"
              dir={langDir}
              translate="no"
            >
              {t("help_center")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 py-4 sm:flex-row">
            <button
              onClick={() => handleOptionSelect("buyer")}
              className="hover:border-primary hover:bg-primary/5 flex w-full max-w-[200px] flex-col items-center justify-center gap-4 rounded-lg border-2 border-border bg-card p-6 transition-all hover:shadow-md sm:w-auto sm:flex-1"
              dir={langDir}
              translate="no"
            >
              <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
                <User className="text-muted-foreground h-8 w-8" />
              </div>
              <span className="text-foreground text-base font-medium">
                {t("for_buyers")}
              </span>
            </button>

            <button
              onClick={() => handleOptionSelect("supplier")}
              className="hover:border-primary hover:bg-primary/5 flex w-full max-w-[200px] flex-col items-center justify-center gap-4 rounded-lg border-2 border-border bg-card p-6 transition-all hover:shadow-md sm:w-auto sm:flex-1"
              dir={langDir}
              translate="no"
            >
              <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
                <Building2 className="text-muted-foreground h-8 w-8" />
              </div>
              <span className="text-foreground text-base font-medium">
                {t("for_suppliers")}
              </span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  );
};

export default Footer;

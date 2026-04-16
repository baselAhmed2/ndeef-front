"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { usePreferences } from "@/app/context/PreferencesContext";
import { translateText } from "@/app/lib/translations";

const TRANSLATABLE_ATTRIBUTES = ["placeholder", "aria-label", "title", "alt"] as const;
const TEXT_SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "SVG",
  "CANVAS",
  "CODE",
  "PRE",
]);
const ATTRIBUTE_SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "CANVAS", "CODE", "PRE"]);
const OBSERVER_OPTIONS: MutationObserverInit = {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
  attributeFilter: [...TRANSLATABLE_ATTRIBUTES],
};

type TranslationMeta = {
  original: string;
  translated: string;
};

function isInsideNoTranslate(element: Element | null) {
  return Boolean(element?.closest("[data-no-translate]"));
}

function shouldTranslateTextNode(node: Text) {
  const parent = node.parentElement;
  if (!parent || !node.data.trim()) return false;
  if (isInsideNoTranslate(parent)) return false;
  return !TEXT_SKIP_TAGS.has(parent.tagName);
}

function shouldTranslateElementAttributes(element: Element) {
  if (isInsideNoTranslate(element)) return false;
  return !ATTRIBUTE_SKIP_TAGS.has(element.tagName);
}

function updateMeta(meta: TranslationMeta | undefined, currentValue: string) {
  if (!meta || (currentValue !== meta.original && currentValue !== meta.translated)) {
    return { original: currentValue, translated: currentValue };
  }
  return meta;
}

export function ProjectPreferenceRuntime() {
  const { language } = usePreferences();
  const pathname = usePathname() ?? "";
  const textNodesRef = useRef(new WeakMap<Text, TranslationMeta>());
  const attributesRef = useRef(new WeakMap<Element, Map<string, TranslationMeta>>());
  const titleRef = useRef<TranslationMeta | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const frameRef = useRef<number | null>(null);

  const applyLanguage = useCallback(() => {
    if (typeof document === "undefined") return;

    const body = document.body;
    if (!body) return;

    observerRef.current?.disconnect();

    titleRef.current = updateMeta(titleRef.current ?? undefined, document.title);
    const nextTitle = language === "ar" ? translateText(titleRef.current.original, language) : titleRef.current.original;
    titleRef.current.translated = nextTitle;
    if (document.title !== nextTitle) {
      document.title = nextTitle;
    }

    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return shouldTranslateTextNode(node as Text) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });

    let currentNode = walker.nextNode();
    while (currentNode) {
      const textNode = currentNode as Text;
      const meta = updateMeta(textNodesRef.current.get(textNode), textNode.data);
      const translated = translateText(meta.original, language);
      meta.translated = translated;
      textNodesRef.current.set(textNode, meta);

      const nextValue = language === "ar" ? translated : meta.original;
      if (textNode.data !== nextValue) {
        textNode.data = nextValue;
      }

      currentNode = walker.nextNode();
    }

    const attributeSelector = TRANSLATABLE_ATTRIBUTES.map((attribute) => `[${attribute}]`).join(",");
    body.querySelectorAll(attributeSelector).forEach((element) => {
      if (!shouldTranslateElementAttributes(element)) return;

      let elementAttributes = attributesRef.current.get(element);
      if (!elementAttributes) {
        elementAttributes = new Map<string, TranslationMeta>();
        attributesRef.current.set(element, elementAttributes);
      }

      TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
        const currentValue = element.getAttribute(attribute);
        if (!currentValue?.trim()) return;

        const meta = updateMeta(elementAttributes.get(attribute), currentValue);
        const translated = translateText(meta.original, language);
        meta.translated = translated;
        elementAttributes.set(attribute, meta);

        const nextValue = language === "ar" ? translated : meta.original;
        if (currentValue !== nextValue) {
          element.setAttribute(attribute, nextValue);
        }
      });
    });

    observerRef.current?.observe(body, OBSERVER_OPTIONS);
  }, [language]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const scheduleApply = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        applyLanguage();
      });
    };
    const scheduleSettledApply = () => {
      scheduleApply();
      window.setTimeout(scheduleApply, 80);
      window.setTimeout(scheduleApply, 260);
    };

    observerRef.current?.disconnect();
    observerRef.current = new MutationObserver(scheduleApply);
    observerRef.current.observe(document.body, OBSERVER_OPTIONS);

    window.addEventListener("nadeef:preferences-changed", scheduleSettledApply);
    scheduleSettledApply();

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      window.removeEventListener("nadeef:preferences-changed", scheduleSettledApply);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [applyLanguage, pathname]);

  return null;
}

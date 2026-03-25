const ICON_FILE_MAP = Object.freeze({
  windows_logo: "w95_1.ico",
  computer: "w95_28.ico",
  recycle_bin: "w95_32.ico",
  control_panel: "w95_37.ico",
  internet_explorer: "w95_14.ico",
  folder: "w95_4.ico",
  run: "w95_67.ico",
  settings: "w95_61.ico",
  task_manager: "w95_58.ico",
  document: "w95_60.ico",
  network: "w95_53.ico",
  volume: "w95_35.ico",
  clock: "w95_64.ico",
  modem: "w95_69.ico",
  drive_hdd: "w95_6.ico",
  drive_floppy: "w95_9.ico",
  app: "w95_6.ico",
});

function resolveIconKey(iconKey = "app") {
  if (iconKey in ICON_FILE_MAP) {
    return iconKey;
  }

  return "app";
}

function getIconUrl(iconKey) {
  const fileName = ICON_FILE_MAP[resolveIconKey(iconKey)];
  return new URL(
    `../../../visuals-to-use/originalWin95icons/${fileName}`,
    import.meta.url,
  ).toString();
}

function resolveIconSource(iconKey, iconUrl) {
  if (typeof iconUrl === "string" && iconUrl.trim()) {
    return {
      key: "custom",
      src: iconUrl.trim(),
      fallback: getIconUrl("internet_explorer"),
    };
  }

  if (typeof iconKey === "string") {
    const trimmed = iconKey.trim();

    if (
      trimmed &&
      (trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("data:") ||
        trimmed.startsWith("/"))
    ) {
      return {
        key: "custom",
        src: trimmed,
        fallback: getIconUrl("internet_explorer"),
      };
    }
  }

  const normalizedIconKey = resolveIconKey(iconKey);
  return {
    key: normalizedIconKey,
    src: getIconUrl(normalizedIconKey),
    fallback: getIconUrl("app"),
  };
}

export function createIconGlyph(iconKey = "app", { compact = false, iconUrl } = {}) {
  const iconSource = resolveIconSource(iconKey, iconUrl);
  const glyph = document.createElement("span");
  glyph.className = "win-icon__glyph";
  glyph.dataset.icon = iconSource.key;
  glyph.setAttribute("aria-hidden", "true");

  if (compact) {
    glyph.classList.add("win-icon__glyph--compact");
  }

  const image = document.createElement("img");
  image.className = "win-icon__image";
  image.src = iconSource.src;
  image.alt = "";
  image.draggable = false;
  image.addEventListener(
    "error",
    () => {
      if (image.src === iconSource.fallback) {
        return;
      }

      image.src = iconSource.fallback;
    },
    { once: true },
  );

  glyph.append(image);

  return glyph;
}

export function createWindowsLogoGlyph({ compact = false } = {}) {
  return createIconGlyph("windows_logo", { compact });
}

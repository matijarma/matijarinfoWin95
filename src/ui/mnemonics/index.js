function isMnemonicCharacter(value) {
  return typeof value === "string" && /^[a-z0-9]$/i.test(value);
}

export function parseMnemonicLabel(label = "") {
  const source = String(label);
  let normalizedLabel = "";
  let mnemonic = null;
  let mnemonicIndex = -1;

  for (let index = 0; index < source.length; index += 1) {
    const current = source[index];

    if (current !== "&") {
      normalizedLabel += current;
      continue;
    }

    const next = source[index + 1];

    if (next === "&") {
      normalizedLabel += "&";
      index += 1;
      continue;
    }

    if (!next) {
      continue;
    }

    if (!mnemonic && isMnemonicCharacter(next)) {
      mnemonic = next.toLowerCase();
      mnemonicIndex = normalizedLabel.length;
    }

    normalizedLabel += next;
    index += 1;
  }

  if (!mnemonic) {
    const fallbackIndex = normalizedLabel.search(/[a-z0-9]/i);

    if (fallbackIndex >= 0) {
      mnemonic = normalizedLabel[fallbackIndex].toLowerCase();
      mnemonicIndex = fallbackIndex;
    }
  }

  return {
    sourceLabel: source,
    label: normalizedLabel,
    mnemonic,
    mnemonicIndex,
  };
}

export function createMnemonicLabelNode(label, className = "") {
  const parsed = parseMnemonicLabel(label);
  const node = document.createElement("span");
  node.className = className;

  if (
    typeof parsed.mnemonicIndex !== "number" ||
    parsed.mnemonicIndex < 0 ||
    parsed.mnemonicIndex >= parsed.label.length
  ) {
    node.textContent = parsed.label;
    return { node, parsed };
  }

  const before = parsed.label.slice(0, parsed.mnemonicIndex);
  const mnemonicCharacter = parsed.label[parsed.mnemonicIndex];
  const after = parsed.label.slice(parsed.mnemonicIndex + 1);

  if (before) {
    node.append(document.createTextNode(before));
  }

  const mnemonicNode = document.createElement("span");
  mnemonicNode.className = "os-mnemonic";
  mnemonicNode.textContent = mnemonicCharacter;
  node.append(mnemonicNode);

  if (after) {
    node.append(document.createTextNode(after));
  }

  return { node, parsed };
}

export function getMnemonicFromKeyEvent(event) {
  if (!event || typeof event.key !== "string" || event.key.length !== 1) {
    return null;
  }

  return isMnemonicCharacter(event.key) ? event.key.toLowerCase() : null;
}

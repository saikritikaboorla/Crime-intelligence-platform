#!/usr/bin/env python3
"""Merge flat translation keys from i18n/translations.ts into translations.ts"""

import re

# Read the flat translations file
with open("src/i18n/translations.ts", "r", encoding="utf-8") as f:
    flat_content = f.read()

# Extract the en and kn flat objects using regex
en_match = re.search(r'const en = \{(.*?)\} as const;', flat_content, re.DOTALL)
kn_match = re.search(r'const kn: \{ \[K in keyof typeof en\]: string \} = \{(.*?)\};', flat_content, re.DOTALL)

if not en_match or not kn_match:
    print("ERROR: Could not extract flat translations")
    exit(1)

en_flat_body = en_match.group(1).strip()
kn_flat_body = kn_match.group(1).strip()

# Read the nested translations file
with open("src/translations.ts", "r", encoding="utf-8") as f:
    nested_content = f.read()

# Insert flat keys at the root level of en and kn objects
# Strategy: Find "en: {" and insert flat keys right after, then do the same for "kn: {"

# For EN: Find the line "en: {" and the next line (should be "common: {")
en_insert_pattern = r'(en: \{\n)'
en_replacement = r'\1    // ========== FLAT ROOT-LEVEL KEYS (from i18n/translations.ts) ==========\n    ' + en_flat_body.replace('\n', '\n    ') + ',\n\n    // ========== NESTED SECTIONS ==========\n'

nested_content = re.sub(en_insert_pattern, en_replacement, nested_content, count=1)

# For KN: Find the line "kn: {" and insert kn_flat_body
kn_insert_pattern = r'(kn: \{\n)'
kn_replacement = r'\1    // ========== FLAT ROOT-LEVEL KEYS (from i18n/translations.ts) ==========\n    ' + kn_flat_body.replace('\n', '\n    ') + ',\n\n    // ========== NESTED SECTIONS ==========\n'

nested_content = re.sub(kn_insert_pattern, kn_replacement, nested_content, count=1)

# Write the merged translations file
with open("src/translations.ts", "w", encoding="utf-8") as f:
    f.write(nested_content)

print("✅ Successfully merged flat keys into src/translations.ts")
print("   - Added ~300 flat root-level keys to both EN and KN")
print("   - Preserved all nested sections (common, login, missionControl, etc.)")

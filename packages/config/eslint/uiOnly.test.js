import { RuleTester } from "eslint";
import { uiOnlyPlugin } from "./uiOnly.js";

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("ui-only", uiOnlyPlugin.rules["ui-only"], {
  valid: [
    'import { Button, Icon } from "@linky-fit/ui"; <Button icon="Send" />;',
    'import { Camera } from "lucide-react-native";',
    "<Stack style={{ flex: 1 }} />;",
    { code: "<video muted />;", options: [{ allow: ["video"] }] },
  ],
  invalid: [
    { code: "<div />;", errors: [{ messageId: "element" }] },
    {
      code: "<Text className='muted' />;",
      errors: [{ messageId: "className" }],
    },
    {
      code: "<video style={{ width: 1 }} />;",
      options: [{ allow: ["video"] }],
      errors: [{ messageId: "style" }],
    },
    {
      code: 'import { Bell } from "lucide-react";',
      errors: [{ messageId: "icons" }],
    },
  ],
});

import { RuleTester } from "@typescript-eslint/rule-tester";
import * as tsParser from "@typescript-eslint/parser";
import preferInlineTypeParameters from "../lib/prefer-inline-type-parameters.js";
import { afterAll, describe, it } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
    },
  },
});

ruleTester.run("prefer-inline-type-parameters", preferInlineTypeParameters, {
  valid: [
    {
      name: "type used multiple times",
      code: `
type UserProps = {
  name: string;
  age: number;
};

const UserA = ({ name, age }: UserProps) => {
  return name;
};

const UserB = ({ name, age }: UserProps) => {
  return age;
};
      `,
    },
    {
      name: "exported type",
      code: `
export type UserProps = {
  name: string;
};

export const User = ({ name }: UserProps) => {
  return name;
};
      `,
    },
    {
      name: "already inlined type",
      code: `
const User = ({ name, age }: { name: string; age: number }) => {
  return name;
};
      `,
    },
    {
      name: "interface used in multiple places",
      code: `
interface UserProps {
  name: string;
  age: number;
}

const UserA = ({ name, age }: UserProps) => name;
const UserB = ({ name, age }: UserProps) => age;
      `,
    },
    {
      name: "type used in return type",
      code: `
type Result = {
  success: boolean;
};

function getResult(): Result {
  return { success: true };
}
      `,
    },
    {
      name: "type used in variable declaration",
      code: `
type Config = {
  enabled: boolean;
};

const config: Config = { enabled: true };
      `,
    },
    {
      name: "type used in class property",
      code: `
type UserData = {
  name: string;
};

class User {
  data: UserData;
}
      `,
    },
    {
      name: "generic type with type parameter",
      code: `
type PaginatedResponse<T> = {
  items: T[];
  total: number;
};

function getItems(response: PaginatedResponse<string>) {
  return response.items;
}
      `,
    },
    {
      name: "generic type with multiple type parameters",
      code: `
type Result<T, E> = {
  data?: T;
  error?: E;
};

const handleResult = (result: Result<string, Error>) => {
  return result.data;
};
      `,
    },
    {
      name: "generic type with constraints",
      code: `
type Container<T extends object> = {
  value: T;
  metadata: Record<string, any>;
};

function processContainer(container: Container<{ id: number }>) {
  return container.value;
}
      `,
    },
    {
      name: "intersection type used multiple times",
      code: `
type BaseProps = { id: string };
type ExtendedProps = BaseProps & { name: string };

const ComponentA = (props: ExtendedProps) => {
  return props.name;
};

const ComponentB = (props: ExtendedProps) => {
  return props.id;
};
      `,
    },
    {
      name: "utility type Pick - base type reused",
      code: `
type User = {
  id: string;
  name: string;
  email: string;
};

const getUser = (user: Pick<User, 'id' | 'name'>) => {
  return user.name;
};

const displayUser = (user: User) => {
  return user.email;
};
      `,
    },
    {
      name: "utility type Omit - base type reused",
      code: `
type FullConfig = {
  api: string;
  secret: string;
  debug: boolean;
};

const publicConfig = (config: Omit<FullConfig, 'secret'>) => {
  return config.api;
};

const privateConfig = (config: FullConfig) => {
  return config.secret;
};
      `,
    },
    {
      name: "utility type Partial - base type reused",
      code: `
type Settings = {
  theme: string;
  language: string;
};

const updateSettings = (settings: Partial<Settings>) => {
  return settings.theme;
};

const getSettings = (): Settings => {
  return { theme: 'dark', language: 'en' };
};
      `,
    },
    {
      name: "type used in both variable declaration and function parameter",
      code: `
type Config = {
  enabled: boolean;
};

const config: Config = { enabled: true };

function updateConfig(newConfig: Config) {
  return newConfig;
}
      `,
    },
  ],

  invalid: [
    {
      name: "single use type alias in function parameter",
      code: `
type UserProps = {
  name: string;
  age: number;
};

const User = ({ name, age }: UserProps) => {
  return name;
};
      `,
      errors: [
        {
          messageId: "preferInlineType",
          data: { typeName: "UserProps" },
        },
      ],
      output: `

const User = ({ name, age }: {
  name: string;
  age: number;
}) => {
  return name;
};
      `,
    },
    {
      name: "single use interface in function parameter",
      code: `
interface UserProps {
  name: string;
  age: number;
}

const User = ({ name, age }: UserProps) => {
  return name;
};
      `,
      errors: [
        {
          messageId: "preferInlineType",
          data: { typeName: "UserProps" },
        },
      ],
      output: `

const User = ({ name, age }: {
  name: string;
  age: number;
}) => {
  return name;
};
      `,
    },
    {
      name: "single use type in arrow function with optional properties",
      code: `
type ComponentProps = {
  value: boolean;
  disabled?: boolean;
  showLabel?: boolean;
};

const Component = ({ value, disabled = false, showLabel = false }: ComponentProps) => {
  return value;
};
      `,
      errors: [
        {
          messageId: "preferInlineType",
          data: { typeName: "ComponentProps" },
        },
      ],
      output: `

const Component = ({ value, disabled = false, showLabel = false }: {
  value: boolean;
  disabled?: boolean;
  showLabel?: boolean;
}) => {
  return value;
};
      `,
    },
    {
      name: "single use type in regular function",
      code: `
type Params = {
  id: string;
};

function getUser({ id }: Params) {
  return id;
}
      `,
      errors: [
        {
          messageId: "preferInlineType",
          data: { typeName: "Params" },
        },
      ],
      output: `

function getUser({ id }: {
  id: string;
}) {
  return id;
}
      `,
    },
    {
      name: "single use type in function expression",
      code: `
type HandlerProps = {
  event: string;
};

const handler = function({ event }: HandlerProps) {
  return event;
};
      `,
      errors: [
        {
          messageId: "preferInlineType",
          data: { typeName: "HandlerProps" },
        },
      ],
      output: `

const handler = function({ event }: {
  event: string;
}) {
  return event;
};
      `,
    },
    {
      name: "complex nested type structure",
      code: `
type NestedProps = {
  user: {
    name: string;
    meta: {
      age: number;
    };
  };
};

const Component = ({ user }: NestedProps) => user.name;
      `,
      errors: [
        {
          messageId: "preferInlineType",
          data: { typeName: "NestedProps" },
        },
      ],
      output: `

const Component = ({ user }: {
  user: {
    name: string;
    meta: {
      age: number;
    };
  };
}) => user.name;
      `,
    },
    {
      name: "type with union types",
      code: `
type Status = {
  value: 'active' | 'inactive' | 'pending';
};

const getStatus = ({ value }: Status) => value;
      `,
      errors: [
        {
          messageId: "preferInlineType",
          data: { typeName: "Status" },
        },
      ],
      output: `

const getStatus = ({ value }: {
  value: 'active' | 'inactive' | 'pending';
}) => value;
      `,
    },
    {
      name: "type with JSDoc comments",
      code: `
type ComponentProps = {
  /** The main value */
  value: string;
  /** Whether the component is interactive */
  disabled?: boolean;
};

const Component = ({ value, disabled }: ComponentProps) => {
  return value;
};
      `,
      errors: [
        {
          messageId: "preferInlineType",
          data: { typeName: "ComponentProps" },
        },
      ],
      output: `

const Component = ({ value, disabled }: {
  /** The main value */
  value: string;
  /** Whether the component is interactive */
  disabled?: boolean;
}) => {
  return value;
};
      `,
    },
    {
      name: "type with inline comments",
      code: `
type ConfigProps = {
  // API endpoint
  apiUrl: string;
  // Debug mode flag
  debug: boolean;
};

const setupConfig = ({ apiUrl, debug }: ConfigProps) => {
  return apiUrl;
};
      `,
      errors: [
        {
          messageId: "preferInlineType",
          data: { typeName: "ConfigProps" },
        },
      ],
      output: `

const setupConfig = ({ apiUrl, debug }: {
  // API endpoint
  apiUrl: string;
  // Debug mode flag
  debug: boolean;
}) => {
  return apiUrl;
};
      `,
    },
    {
      name: "mapped type",
      code: `
type FeatureFlags = {
  [K in 'new-profile-page' | 'beta-dashboard']: boolean;
};

const checkFlags = (flags: FeatureFlags) => {
  return flags['new-profile-page'];
};
      `,
      errors: [
        {
          messageId: "preferInlineType",
          data: { typeName: "FeatureFlags" },
        },
      ],
      output: `

const checkFlags = (flags: {
  [K in 'new-profile-page' | 'beta-dashboard']: boolean;
}) => {
  return flags['new-profile-page'];
};
      `,
    },
    {
      name: "type with index signature",
      code: `
type Dictionary = {
  [key: string]: any;
};

const processDictionary = (dict: Dictionary) => {
  return dict;
};
      `,
      errors: [
        {
          messageId: "preferInlineType",
          data: { typeName: "Dictionary" },
        },
      ],
      output: `

const processDictionary = (dict: {
  [key: string]: any;
}) => {
  return dict;
};
      `,
    },
    {
      name: "type with multiple index signatures",
      code: `
type MixedIndex = {
  [key: string]: string | number;
  [index: number]: number;
};

const handleMixed = (data: MixedIndex) => {
  return data;
};
      `,
      errors: [
        {
          messageId: "preferInlineType",
          data: { typeName: "MixedIndex" },
        },
      ],
      output: `

const handleMixed = (data: {
  [key: string]: string | number;
  [index: number]: number;
}) => {
  return data;
};
      `,
    },
    {
      name: "type with mixed comments and properties",
      code: `
type UserSettings = {
  /** User's preferred theme */
  theme: 'light' | 'dark';
  // Language setting
  language: string;
  notifications: boolean; // Enable notifications
};

const applySettings = ({ theme, language, notifications }: UserSettings) => {
  return theme;
};
      `,
      errors: [
        {
          messageId: "preferInlineType",
          data: { typeName: "UserSettings" },
        },
      ],
      output: `

const applySettings = ({ theme, language, notifications }: {
  /** User's preferred theme */
  theme: 'light' | 'dark';
  // Language setting
  language: string;
  notifications: boolean; // Enable notifications
}) => {
  return theme;
};
      `,
    },
    {
      name: "conditional type (simple)",
      code: `
type ResponseData = {
  data: string extends string ? string : never;
};

const processResponse = (response: ResponseData) => {
  return response.data;
};
      `,
      errors: [
        {
          messageId: "preferInlineType",
          data: { typeName: "ResponseData" },
        },
      ],
      output: `

const processResponse = (response: {
  data: string extends string ? string : never;
}) => {
  return response.data;
};
      `,
    },
    {
      name: "type with readonly modifiers",
      code: `
type ReadonlyProps = {
  readonly id: string;
  readonly values: readonly string[];
};

const displayReadonly = ({ id, values }: ReadonlyProps) => {
  return id;
};
      `,
      errors: [
        {
          messageId: "preferInlineType",
          data: { typeName: "ReadonlyProps" },
        },
      ],
      output: `

const displayReadonly = ({ id, values }: {
  readonly id: string;
  readonly values: readonly string[];
}) => {
  return id;
};
      `,
    },
  ],
});

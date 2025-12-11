# eslint-plugin-ts-inline-parameter-types

ESLint plugin that flags single-use type definitions in function parameters.

## Installation

```bash
bun add -d eslint-plugin-ts-inline-parameter-types
```

```javascript
import tsInlineParameterTypes from 'eslint-plugin-ts-inline-parameter-types';

export default [
  {
    plugins: {
      'ts-inline-parameter-types': tsInlineParameterTypes,
    },
    rules: {
      'ts-inline-parameter-types/prefer-inline-type-parameters': 'warn',
    },
  },
];
```

## Rule: `prefer-inline-type-parameters`

Warns when a type is defined separately but only used once in a function parameter.

#### ❌ Incorrect

```typescript
type UserProps = {
  name: string;
  age: number;
};

const User = ({ name, age }: UserProps) => {
  return <div>{name}</div>;
};
```

```typescript
interface Config {
  apiUrl: string;
  timeout: number;
}

function initApi(config: Config) {
  return config.apiUrl;
}
```

#### ✅ Correct

```typescript
const User = ({ name, age }: {
  name: string;
  age: number;
}) => {
  return <div>{name}</div>;
};
```

```typescript
function initApi(config: {
  apiUrl: string;
  timeout: number;
}) {
  return config.apiUrl;
}
```

Auto-fix handles this transformation automatically.

---

### Skipped cases

#### Type is reused

```typescript
type UserProps = {
  name: string;
};

const UserA = ({ name }: UserProps) => <div>{name}</div>;
const UserB = ({ name }: UserProps) => <span>{name}</span>;
```

#### Type is exported

```typescript
export type UserProps = {
  name: string;
};

export const User = ({ name }: UserProps) => {
  return <div>{name}</div>;
};
```

#### Type used in non-parameter context

```typescript
type Config = {
  enabled: boolean;
};

const config: Config = { enabled: true };
```

#### Type used in multiple contexts

```typescript
type Config = {
  enabled: boolean;
};

const config: Config = { enabled: true };

function updateConfig(newConfig: Config) {
  // ...
}
```

## Development

```bash
bun install
bun test
bun run format
bun run lint
```

## License

MIT

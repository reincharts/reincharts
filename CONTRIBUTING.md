# Contributing

Thanks for your interest in contributing to Reincharts. We're happy to have you here.

Please take a moment to review this document before submitting your pull request. We also strongly recommend that you check for open issues and pull requests to see if someone else is working on something similar.

If you need any help, feel free to open a discussion.

## About this repository

This repository is a monorepo for interactive charting components built with React and TypeScript.

- Uses [npm](https://npmjs.com/) for development.
- Uses [Lerna](https://lerna.js.org/) as our monorepo management tool.
- Uses [TypeScript](https://www.typescriptlang.org/) for type safety and better developer experience.
- Uses [Storybook](https://storybook.js.org/) for component documentation.
- Uss a [Next.js](https://nextjs.org/) site for documentation.


## Structure

This repository is structured as follows:

```
packages/
├── annotations/     # Label and annotation components
├── axes/           # X and Y axis components  
├── charts/         # Main chart package that re-exports all components
├── coordinates/    # Coordinate systems, cursors, and overlays
├── core/           # Core functionality, base components, and shared utilities
├── indicators/     # Technical analysis indicators (MACD, RSI, Bollinger Bands, etc.)
├── interactive/    # Interactive drawing tools and annotations
├── scales/         # Scale functions and domain utilities
├── series/         # Chart series components (Candlestick, Line, Area, etc.)
├── stories/        # Storybook stories and component examples
├── tooltip/        # Tooltip components for data display
└── utils/          # Shared utility functions and helpers
```

It has these build scripts:

| Build Command | Description |
|---------------|-------------|
| `npm run build` | Build all packages in dependency order then builds docs |
| `npm run build:<package>` | Build only the package specified |
| `npm run docs` | Builds storybook and typedocs |
| `npm run docs:stories` | Builds only storybook. Puts output in docs/ |
| `npm run docs:typedoc` | Builds only typedocs. Puts output in typedocs/ |
| `npm run build:web` | Builds the documentation website. Runs `build` first because it uses typedocs and storybook output. Puts output in web/ |

It has these run scripts:

| Run Command | Description |
|---------------|-------------|
| `npm run start` | Starts the storybook development server |
| `npm run start:web` | Starts the built documentation server |
| `npm run dev` (in packages/stories) | Starts the documentation development server |

## Development

### Fork this repo

You can fork this repo by clicking the fork button in the top right corner of this page.

### Clone on your local machine

```bash
git clone https://github.com/your-username/reincharts.git
```

### Navigate to project directory

```bash
cd reincharts
```

### Create a new branch

```bash
git checkout -b my-new-feature
```

### Install dependencies

```bash
npm install
```

### Build the packages

```bash
npm run build
```

### Run Storybook for development

You can run Storybook to see components in action and test your changes:

```bash
npm run start
```

or 
```bash
cd packages/stories
npm run start
```

This will start the documentation development server at `http://localhost:4444`.

The stories files are located in `packages/stories/src/stories`

### Run documentation site for development

You can run the documentaion site in development to test changes to it:

or 
```bash
cd packages/stories
npm run dev
```

This will start the documentation development server at `http://localhost:3000`.

## Documentation

### Storybook Stories

Storybook is used for component documentation and interactive examples. When adding or modifying components:

1. Create or update the corresponding story file
2. Include examples showing different use cases
3. Document component props and usage patterns

### API Documentation

API documentation is generated using TypeDoc. To build and view the documentation:

```bash
npm run docs:typedoc
```

The generated documentation will be available in the `typedocs/` directory.

## Component Development

When developing new components or modifying existing ones:

### Adding New Components

1. **Choose the right package** - Place your component in the most appropriate package
2. **Follow naming conventions** - Use PascalCase for component names
3. **Include TypeScript types** - All components must have proper type definitions
4. **Write stories** - Create Storybook stories for your components
5. **Export properly** - Update the package's `index.ts` file
6. **Include Comments** - Add comments to both functions and props help others understand your code. JSDoc comments get inlcuded in the typedocs. 

## Code Style

The codebase is written in TypeScript with strict settings enabled. ESLint is used for code linting and formatting.

### Style Guidelines

- **TypeScript**: Use strict mode with all warnings and errors enabled
- **Formatting**: Run `npm run lint:fix` to auto-format code
- **File Length**: Keep files short when possible
- **Naming**: Use descriptive names for variables and functions
- **Comments**: Include JSDoc comments for public APIs
- **Imports**: Use absolute imports and organize them logically

### Running the linter

```bash
# Check for style issues
npm run lint

# Auto-fix style issues
npm run lint:fix
```

## Commit Convention

Before creating a Pull Request, please check that your commits comply with the commit conventions used in this repository.

When you create a commit, please follow the convention `category(scope): message` using one of the following categories:

- `feat`: New features or enhancements
- `fix`: Bug fixes
- `refactor`: Code refactoring without functional changes
- `docs`: Documentation changes
- `build`: Build system or dependency changes
- `test`: Adding or modifying tests
- `ci`: CI/CD configuration changes
- `chore`: Other changes that don't modify src or test files
- `style`: Code style changes (formatting, semicolons, etc.)
- `perf`: Performance improvements

### Examples

- `feat(series): add volume profile series component`
- `fix(indicators): correct MACD calculation for edge cases`
- `docs(readme): update instructions`
- `refactor(core): simplify chart rendering logic`

For more details, see [Conventional Commits](https://www.conventionalcommits.org/).

## Pull Request Process

1. **Create an issue** - For significant changes, create an issue first to discuss the issue
2. **Fork and branch** - Create a feature branch from main
3. **Implement changes** - Make your changes following the guidelines above
4. **Update documentation** - Update stories, README, or other docs as needed
5. **Submit PR** - Create a pull request with a clear description

### Pull Request Checklist

- [ ] Lint checks pass (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation site is updated
- [ ] Storybook stories are added/updated
- [ ] Comments are added/updated
- [ ] Commit messages follow convention
- [ ] Changes are focused

## Package Publishing

Package publishing is handled automatically through CI/CD. When changes are merged to main:

1. Lerna detects changed packages
2. Versions are bumped according to conventional commits
3. Packages are built and published to npm
4. Documentation is updated and deployed

## Getting Help

If you need help or have questions:

- Check the [documentation](https://reincharts.com/)
- [Open an issue](https://github.com/reincharts/reincharts/issues) for bugs
- [Start a discussion](https://github.com/reincharts/reincharts/discussions) for questions
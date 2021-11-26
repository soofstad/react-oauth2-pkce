# How to create a new release

```bash
# Bump version in './src/package.json'
git commit -m "foo"
git tag v?.?.? -m "A Message"
git push --tags
cd src
tsc --skipLibCheck
npm publish
```

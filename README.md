# MySQL Schema Info For ts-check
This program will make index.d.ts, which can be used with VS Code IntelliSense (@ts-check option).

```
usage)
npm install --production
node index.js mysql://user:pwd@db.server.com/MyDB[/tablename] [-d save_dir]
-or-
npm install
npx webpack
cp mysql-schema.js ../your-project/
cd ../your-project/
node mysql-schema.js mysql://...
```

In program.js
```
// @ts-check

/** @type {import('./MyDB').tablename} */
const obj = {
  id: ...
};
```

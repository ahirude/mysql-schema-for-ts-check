# MySQL Schema Info For ts-check
This program will make index.d.ts, which can be used with VS Code IntelliSense (@ts-check option).

```
usage)
npm install --production
node index.js mysql://user:pwd@db.server.com/MyDB[/tablename] [-d save_dir] [-j]
-or-
npm install
npx webpack
cp mysql-schema.js ../your-project/
cd ../your-project/
node mysql-schema.js mysql://...
```

To use output file
```
// @ts-check

/** @type {import('./MyDB').tablename} */
const obj = {
  id: ...
};
```

with -j option
```
// @ts-check

/** @typedef {import('./MyDB').tablename} TableName */
/** @type {TableName} */
const obj = {
  id: ...
};

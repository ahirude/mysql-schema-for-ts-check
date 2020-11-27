# MySQL Schema Info For ts-check
This program will make index.d.ts, which can be used with VS Code IntelliSense (@ts-check option).

```
usage)
node index.js mysql://user:pwd@db.server.com/MyDB[/tablename] [-d save_dir]
```

In program.js
```
// @ts-check

const MyDB = require('./MyDB');

/** @type {MyDB.tablename} */
const obj = {
  id: ...
};
```

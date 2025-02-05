# batch

`batch` is a module to provide `denops.batch()` helper functions.

- [API documentation](https://doc.deno.land/https/deno.land/x/denops_std/batch/mod.ts)

## Usage

### batch

Use `batch()` to call multiple denops functions sequentially without overhead
like:

```typescript
import { Denops } from "../mod.ts";
import { batch } from "../batch/mod.ts";

export async function main(denops: Denops): Promise<void> {
  await batch(denops, async (denops) => {
    await denops.cmd("setlocal modifiable");
    await denops.cmd("setlocal noswap");
    await denops.cmd("setlocal nobackup");
  });
}
```

The function can be nested thus users can use functions which may internally use
`batch()` like:

```typescript
import { Denops } from "../mod.ts";
import { batch } from "../batch/mod.ts";

async function replace(denops: Denops, content: string): Promise<void> {
  await batch(denops, async (denops) => {
    await denops.cmd("setlocal modifiable");
    await denops.cmd("setlocal foldmethod=manual");
    await denops.call("setline", 1, content.split(/\r?\n/));
    await denops.cmd("setlocal nomodifiable");
    await denops.cmd("setlocal nomodified");
  });
}

export async function main(denops: Denops): Promise<void> {
  await batch(denops, async (denops) => {
    await denops.cmd("edit Hello");
    await replace(denops, "Hello Darkness My Old Friend");
  });
}
```

Note that `denops.call()`, `denops.batch()`, or `denops.eval()` always return
falsy value in `batch()`, indicating that you **cannot** write code like below:

```typescript
import { Denops } from "../mod.ts";
import { batch } from "../batch/mod.ts";

export async function main(denops: Denops): Promise<void> {
  await batch(denops, async (denops) => {
    // !!! DON'T DO THIS !!!
    if (await denops.eval("&verbose")) {
      await denops.cmd("echomsg 'VERBOSE'");
    }
    await denops.cmd("echomsg 'Hello world'");
  });
}
```

The `denops` instance passed to the `batch` block is available even outside of
the block. It works like a real `denops` instance, mean that you can write code
like:

```typescript
import { Denops } from "../mod.ts";
import { batch } from "../batch/mod.ts";
import * as anonymous from "../anonymous/mod.ts";

export async function main(denops: Denops): Promise<void> {
  await batch(denops, async (denops) => {
    const [id] = anonymous.add(denops, async () => {
      // This code is called outside of 'batch' block
      // thus the 'denops' instance works like a real one.
      // That's why you can write code like below
      if (await denops.eval("&verbose")) {
        await denops.cmd("echomsg 'VERBOSE'");
      }
      await denops.cmd("echomsg 'Hello world'");
    });
    await denops.cmd(
      `command! Test call denops#request('${denops.name}', '${id}', [])`,
    );
  });
}
```

Note that `denops.redraw()` is executed only once after the batch is actually
executed, no matter how many times it is called in the `batch()`. If the `force`
option is specified even once, the last call will be the one with the force
option specified.

### gather

Use `gather()` to call multiple denops functions sequentially without overhead
and return values like:

```typescript
import { Denops } from "../mod.ts";
import { gather } from "../batch/mod.ts";

export async function main(denops: Denops): Promise<void> {
  const results = await gather(denops, async (denops) => {
    await denops.eval("&modifiable");
    await denops.eval("&modified");
    await denops.eval("&filetype");
  });
  // results contains the value of modifiable, modified, and filetype
}
```

Not like `batch`, the function can NOT be nested.

Note that `denops.call()` or `denops.eval()` always return falsy value in
`gather()`, indicating that you **cannot** write code like below:

```typescript
import { Denops } from "../mod.ts";
import { gather } from "../batch/mod.ts";

export async function main(denops: Denops): Promise<void> {
  const results = await gather(denops, async (denops) => {
    // !!! DON'T DO THIS !!!
    if (await denops.call("has", "nvim")) {
      // deno-lint-ignore no-explicit-any
      await (denops.call("api_info") as any).version;
    } else {
      await denops.eval("v:version");
    }
  });
}
```

The `denops` instance passed to the `gather` block is NOT available outside of
the block. An error is thrown when `denops.call()`, `denops.cmd()`, or
`denops.eval()` is called.

Note that `denops.redraw()` cannot be called within `gather()`. If it is called,
an error is raised.

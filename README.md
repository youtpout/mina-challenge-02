# Mina zkApp: Mina Challenge 02

The message list has fixed size of 200 elements, and autofill incomplete array with empty Message. It's more optimized than use recursive proof mechanism.

I use Uint32 value to optimize space and verification, with Uint32 we don't need to check if value is superior to 0

I use Provable if and gadget and to check if value is correct

On Ryzen 7950X I need between 6 and 8s by test.
On mba early 2014 i5 dual core, 37s for the first test 17-18s for others tests.

## How to build

```sh
npm run build
```

## How to run tests

```sh
npm run test
npm run testw # watch mode
```

## How to run coverage

```sh
npm run coverage
```

## License

[Apache-2.0](LICENSE)

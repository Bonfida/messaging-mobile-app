# Jabber mobile app

<p align="center">
<img src="https://bafybeifyenkk6oytiurf6cikmostgoa23l5snc24e4zz4vbfkgpnfy5wxu.ipfs.infura-ipfs.io/"/>
</p>

⚠️ Warning
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Any content produced by the Bonfida Foundation, or developer resources that the Bonfida Foundation provides, are for educational and inspiration purposes only. Bonfida does not encourage, induce or sanction the deployment of any such applications in violation of applicable laws or regulations.

## Downlaod

- iOS: [https://apps.apple.com/hk/app/jabber-bonfida/id1593196027?l=en](https://apps.apple.com/hk/app/jabber-bonfida/id1593196027?l=en)
- Android: [https://play.google.com/store/apps/details?id=com.bonfida.jabber](https://play.google.com/store/apps/details?id=com.bonfida.jabber)

## Local environment

The app is built with [Expo](https://docs.expo.dev/)

To install the Expo:

```
yarn global add expo-cli
```

To launch the local environment

```
yarn && yarn start
```

## Smart contract

The smart contract can be found here: [Jabber smart contract](https://github.com/Bonfida/jabber)

## Secret key 🚨

The secret key is stored using `expo-secure-store` [https://docs.expo.dev/versions/latest/sdk/securestore/](https://docs.expo.dev/versions/latest/sdk/securestore/)

## Transactions

On the mobile versions, transactions don't need to be approved, **they are automatically approved**.

## Encryption

- DMs: For DMs (i.e 1 on 1 conversations) all messages are encrypted end to end using [Diffie-Hellman keys](https://en.wikipedia.org/wiki/Elliptic-curve_Diffie%E2%80%93Hellman). The encryption happens on the mobile before sending the message on-chain. For images, videos and audios, the file is encrypted using Diffie-Hellman, uploaded on IPFS, then the IPFS hash is encrypted and sent on-chain.

- Groups: Groups are **unencrypted** at the moment. This means that the entire group chat history is visible on-chain. If you want to contribute to the repo to add group encryption using [Double Ratchet](https://signal.org/docs/specifications/doubleratchet/) please reach out to us, grants are available.

## Cost

Gas cost will depend on the length of your message

| Message length (characters) | Transaction fee (SOL) |
| --------------------------- | --------------------- |
| 100                         | ~0.002                |
| 200                         | ~0.0026               |
| 500                         | ~0.00469              |
| 1,000                       | ~0.0082               |
| 2,000                       | ~0.015                |

For files, the gas cost does not depend on the size of the file because only the IPFS hash is sent on-chain.

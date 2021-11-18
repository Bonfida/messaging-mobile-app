# Jabber mobile app

<p align="center">
<img src="https://bafybeifyenkk6oytiurf6cikmostgoa23l5snc24e4zz4vbfkgpnfy5wxu.ipfs.infura-ipfs.io/"/>
</p>

⚠️ Warning
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Any content produced by the Bonfida Foundation, or developer resources that the Bonfida Foundation provides, are for educational and inspiration purposes only. Bonfida does not encourage, induce or sanction the deployment of any such applications in violation of applicable laws or regulations.

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

The smart contract can be found here [Jabber smart contract](https://github.com/Bonfida/jabber)

## Secret key

The secret key is stored using `expo-secure-store` [https://docs.expo.dev/versions/latest/sdk/securestore/](https://docs.expo.dev/versions/latest/sdk/securestore/)

## Transactions

On the mobile versions, transactions don't need to be approved, **they are automatically approved**.

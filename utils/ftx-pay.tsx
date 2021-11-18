export const makeFtxPayUrl = (address: string) => {
  const url = `https://ftx.us/pay/request?coin=SOL&address=${address}&tag=&wallet=sol&memoIsRequired=false&memo=&allowTip=false&fixedWidth=true`;
  return url;
};

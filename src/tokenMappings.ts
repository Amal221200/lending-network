import { batchTx, BiconomyV2AccountInitData, buildItx, buildMultichainReadonlyClient, BridgePlugin, Address, buildTokenMapping, encodeBridgingOps, getTokenAddressForChainId, initKlaster, klasterNodeHost, KlasterSDK, loadBicoV2Account, MultichainTokenMapping, PaymentTokenSymbol, rawTx, deployment, singleTx, buildRpcInfo,  } from "klaster-sdk";
import { getRoutes, RoutesRequest } from "@lifi/sdk";
import { createWalletClient, custom, encodeFunctionData, erc20Abi, Hex } from "viem";
import {  sepolia, arbitrumSepolia } from "viem/chains";

export const mcChainLink = buildTokenMapping([
  deployment(sepolia.id, "0x779877A7B0D9E8603169DdbD7836e478b4624789"),
  deployment(arbitrumSepolia.id, "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E"),
])

export const createKlaster = async (address: `0x${string}`) => {
  const signer = createWalletClient({
    transport: custom((window as any).ethereum),
  });
    const klaster = await initKlaster({
        accountInitData: loadBicoV2Account({
            owner: (await signer.getAddresses())[0], // Fetch
        }),
        nodeUrl: klasterNodeHost.default,
    });

    return klaster
}

export const mcClient = buildMultichainReadonlyClient(
    [sepolia, arbitrumSepolia].map((chain) => {
        return buildRpcInfo(chain.id, chain.rpcUrls.default.http[0]);
    }),
);



export const getUnifiedBalance = async (klaster: KlasterSDK<BiconomyV2AccountInitData>) => {
  
    const uBalance = await mcClient.getUnifiedErc20Balance({
        tokenMapping: mcChainLink,
        account: klaster.account,
    });

    return uBalance;

}

 
export const liFiBrigePlugin: BridgePlugin = async (data) => {
  console.log(data);
  
  const routesRequest: RoutesRequest = {
    fromChainId: data.sourceChainId,
    toChainId: data.destinationChainId,
    fromTokenAddress: data.sourceToken,
    toTokenAddress: data.destinationToken,
    fromAmount: data.amount.toString(),
    fromAddress: Array.from(data.account.uniqueAddresses)[0],
    toAddress: Array.from(data.account.uniqueAddresses)[0],
    
    options: {
      order: "FASTEST",

    },
  };
 
  const result = await getRoutes(routesRequest, );
  const route = result.routes.at(0)
 
  if (!route) {
    throw Error('...');
  }
 
  const routeSteps = route.steps.map(step => {
    if(!step.transactionRequest) { throw Error('...') }
    const { to, gasLimit, data, value} = step.transactionRequest
    if(!to || !gasLimit || !data || !value) { throw Error('...') } 
    return rawTx({
      to: to as Address,
      gasLimit: BigInt(gasLimit),
      data: data as Hex,
      value: BigInt(value)
    })
  })
 
  return {
    receivedOnDestination: BigInt(route.toAmountMin),
    txBatch: batchTx(data.sourceChainId, routeSteps)
  }
};

export async function encodeSupplyItx({
    klasterSDK,
    tokenMapping,
    destChainId,
    inputAmount,
    paymentChainId,
    paymentToken,
    recipientAddress
  }: {
      klasterSDK: KlasterSDK<BiconomyV2AccountInitData>;
    tokenMapping: MultichainTokenMapping;
    destChainId: number;
    inputAmount: bigint;
    paymentChainId: number;
    paymentToken: PaymentTokenSymbol;
    recipientAddress: Address
  }) {
   
    const account = klasterSDK.account;

    const unifiedBalance = await getUnifiedBalance(klasterSDK);


    const bridgingData = await encodeBridgingOps({
      tokenMapping: tokenMapping,
      account: account,
      amount: inputAmount,
      client: mcClient,
      destinationChainId: destChainId,
      unifiedBalance: unifiedBalance,
      bridgePlugin: liFiBrigePlugin,
  });

    const destToken = getTokenAddressForChainId(tokenMapping, destChainId);
    if (!destToken) {
      throw Error('No token in mapping');
    }

    const receivedByBridging = bridgingData.totalReceivedOnDestination;
    const remaining = inputAmount - receivedByBridging;

    const preBridgeOnDest =
      unifiedBalance.breakdown.find((x) => x.chainId === destChainId)?.amount ?? (BigInt(0));

    const destAmount =
      (preBridgeOnDest > inputAmount
        ? inputAmount
        : receivedByBridging + preBridgeOnDest);

    const sendERC20 = rawTx({
      gasLimit: BigInt(100000),
      to: destToken,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [recipientAddress, bridgingData.totalReceivedOnDestination],
      }),
    });

    // const supplyAaveSteps = batchTx(destChainId, [approveAaveTx, supplyAaveTx]);

    return buildItx({
      steps: bridgingData.steps.concat([singleTx(destChainId, sendERC20)]),
      feeTx: klasterSDK.encodePaymentFee( paymentChainId, paymentToken),
    });
  }

  export async function executeItx(itx: ReturnType<typeof buildItx>, klaster: KlasterSDK<BiconomyV2AccountInitData>, account: `0x${string}`) {
    const quote = await klaster.getQuote(itx);
    
    const signer =  createWalletClient({
        transport: custom((window as any).ethereum),
        account: account,
      })

    const signed = await signer.signMessage({
        message: {
          raw: quote.itxHash,
        },
        account: signer.account,
      });

      const result = await klaster.execute(quote, signed);

      return result

  }

//   async getSuggestedGasInfo(excludeChains: number[] = []) {
//     const usdcBalance = await mcClient.getUnifiedErc20Balance({
//       tokenMapping: mcUSDC,
//       address: this.klasterSDK!.account.address,
//     });
//     const usdtBalance = await mcClient.getUnifiedErc20Balance({
//       tokenMapping: mcUSDT,
//       address: this.klasterSDK!.account.address,
//     });
//     const neededAmount = parseUnits('0.5', 6);
//     const usdcEnough = usdcBalance.breakdown.filter(item => !excludeChains.includes(item.chainId))
//     .filter((x) => x.amount > neededAmount)
//     .at(0);
    
//     const usdtEnough = usdtBalance.breakdown.filter(item => !excludeChains.includes(item.chainId))
//       .filter((x) => x.amount > neededAmount)
//       .at(0);

//       if (usdcEnough) {
//       return {
//         chainId: usdcEnough.chainId,
//         paymentToken: 'USDC' as PaymentTokenSymbol,
//       };
//     }
//     if (usdtEnough) {
//       return {
//         chainId: usdtEnough.chainId,
//         paymentToken: 'USDT' as PaymentTokenSymbol,
//       };
//     }
//     return null;
//   }

//   async encodeWithdrawAAVE(
//     amount: bigint,
//     chainId: number,
//     token: 'USDC' | 'USDT',
//   ) {
//     if (!this.klasterSDK) {
//       throw Error(`Klaster SDK not initialized`);
//     }
//     const userAddress = this.klasterSDK.account.address;

//     const tokenAddress =
//       token === 'USDC'
//         ? getTokenAddressForChainId(mcUSDC, chainId)
//         : getTokenAddressForChainId(mcUSDT, chainId);

//     if (!tokenAddress) {
//       throw Error(
//         `Can't fetch the underlying token ${token} on chain ${chainId}`,
//       );
//     }

//     const data = this.aavePositionsService.encodeAaveWithdrawalData(
//       chainId,
//       tokenAddress,
//       amount,
//       userAddress,
//     );

//     const fees = await this.getSuggestedGasInfo();

//     if (!fees) {
//       throw(`Not enough funds to pay for transaction fee.`)
//     }

//     return buildItx({
//       steps: [
//         singleTx(
//           chainId,
//           rawTx({
//             to: this.aavePositionsService.getAavePoolAddress(chainId),
//             gasLimit: BigInt(300000),
//             data: data,
//             value: BigInt(0),
//           }),
//         ),
//       ],
//       feeTx: this.klasterSDK.buildFeeTx(fees.paymentToken, fees.chainId),
//     });
//   }
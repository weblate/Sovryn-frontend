import { usePerpetual_openTrade } from './usePerpetual_openTrade';
import { usePerpetual_depositMarginToken } from './usePerpetual_depositMarginToken';
import { usePerpetual_withdrawAll } from './usePerpetual_withdrawAll';
import { usePerpetual_withdrawMarginToken } from './usePerpetual_withdrawMarginToken';
import { usePerpetual_openTradeWithoutManualDeposit } from './usePerpetual_openTradeWithoutManualDeposit';
import { useMemo, useState } from 'react';
import {
  PerpetualTx,
  PerpetualTxTrade,
  PerpetualTxDepositMargin,
  PerpetualTxWithdrawMargin,
  PerpetualTxMethods,
} from '../components/TradeDialog/types';
import { ResetTxResponseInterface } from '../../../hooks/useSendContractTx';

export const usePerpetual_executeTransaction = () => {
  // TODO: find a nicer solution only this hooks should ever be used anyway
  const { trade, ...tradeRest } = usePerpetual_openTrade();
  // const { trade, ...tradeRest } = usePerpetual_openTradeWithoutManualDeposit();
  const { deposit, ...depositRest } = usePerpetual_depositMarginToken();
  const { withdraw, ...withdrawRest } = usePerpetual_withdrawMarginToken();
  const {
    withdraw: withdrawAll,
    ...withdrawAllRest
  } = usePerpetual_withdrawAll();

  const [transaction, setTransaction] = useState<PerpetualTx>();

  return useMemo(() => {
    let rest: ResetTxResponseInterface | undefined;

    switch (transaction?.method) {
      case PerpetualTxMethods.trade:
        rest = tradeRest;
        break;
      case PerpetualTxMethods.deposit:
        rest = depositRest;
        break;
      case PerpetualTxMethods.withdraw:
        rest = withdrawRest;
        break;
      case PerpetualTxMethods.withdrawAll:
        rest = withdrawAllRest;
        break;
    }

    return {
      execute: (transaction: PerpetualTx) => {
        setTransaction(transaction);
        switch (transaction?.method) {
          case PerpetualTxMethods.trade:
            const tradeTx: PerpetualTxTrade = transaction;
            return trade(
              tradeTx.isClosePosition,
              tradeTx.amount,
              tradeTx.leverage,
              tradeTx.slippage,
              tradeTx.tradingPosition,
            );
          case PerpetualTxMethods.deposit:
            const depositTx: PerpetualTxDepositMargin = transaction;
            return deposit(depositTx.amount);
          case PerpetualTxMethods.withdraw:
            const withdrawTx: PerpetualTxWithdrawMargin = transaction;
            return withdraw(withdrawTx.amount);
          case PerpetualTxMethods.withdrawAll:
            return withdrawAll();
        }
      },
      ...(rest || {}),
      perpetualTx: transaction
        ? {
            ...transaction,
            tx: rest?.txData,
          }
        : undefined,
    };
  }, [
    trade,
    tradeRest,
    deposit,
    depositRest,
    withdraw,
    withdrawRest,
    withdrawAll,
    withdrawAllRest,
    transaction,
  ]);
};

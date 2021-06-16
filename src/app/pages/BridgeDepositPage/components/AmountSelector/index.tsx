/**
 *
 * BridgeDepositPage
 *
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bignumber } from 'mathjs';
import type { Chain } from 'types';

import { actions } from '../../slice';
import { selectBridgeDepositPage } from '../../selectors';
import { BridgeDictionary } from '../../dictionaries/bridge-dictionary';
import { CrossBridgeAsset } from '../../types/cross-bridge-asset';
import { Button } from '../../../../components/Form/Button';
import { useTokenBalance } from '../../hooks/useTokenBalance';
import { AssetModel } from '../../types/asset-model';
import { AmountInput } from '../AmountInput';
import { FormGroup } from '../../../../components/Form/FormGroup';
import { useBridgeLimits } from '../../hooks/useBridgeLimits';
import { toNumberFormat } from '../../../../../utils/display-text/format';
import { fromWei } from 'utils/blockchain/math-helpers';

interface Props {}

export function AmountSelector(props: Props) {
  const { amount, chain, targetChain, sourceAsset } = useSelector(
    selectBridgeDepositPage,
  );
  const dispatch = useDispatch();

  const asset = useMemo(
    () =>
      BridgeDictionary.get(chain as Chain, targetChain)?.getAsset(
        sourceAsset as CrossBridgeAsset,
      ) as AssetModel,
    [chain, sourceAsset, targetChain],
  );

  const [value, setValue] = useState(
    amount ? asset.fromWei(amount, asset.minDecimals) : '',
  );

  const selectAmount = useCallback(() => {
    dispatch(actions.selectAmount(asset.toWei(value || '0')));
  }, [dispatch, asset, value]);

  const balance = useTokenBalance(chain as any, asset);

  const { value: limits, loading: limitsLoading } = useBridgeLimits(
    chain as any,
    targetChain as any,
    asset,
  );

  const valid = useMemo(() => {
    const bnAmount = bignumber(asset.toWei(value || '0'));
    const bnBalance = bignumber(balance.value || '0');
    return (
      !limitsLoading &&
      !balance.loading &&
      bnBalance.greaterThanOrEqualTo(bnAmount) &&
      bnAmount.greaterThan(0) &&
      bnAmount.greaterThanOrEqualTo(limits.returnData.getMinPerToken) &&
      bnAmount.lessThanOrEqualTo(limits.returnData.getMaxTokensAllowed) &&
      bignumber(limits.returnData.dailyLimit).greaterThanOrEqualTo(
        bnAmount.add(limits.returnData.spentToday),
      )
    );
  }, [
    asset,
    balance.loading,
    balance.value,
    limits.returnData.dailyLimit,
    limits.returnData.getMaxTokensAllowed,
    limits.returnData.getMinPerToken,
    limits.returnData.spentToday,
    limitsLoading,
    value,
  ]);

  return (
    <div>
      <h1>Enter amount to deposit ({sourceAsset})</h1>
      <div className="tw-mw-320">
        <FormGroup label="Amount">
          <AmountInput
            value={value}
            onChange={val => setValue(val)}
            asset={asset}
            maxAmount={balance.value}
          />
          <p>
            Balance:{' '}
            {toNumberFormat(asset.fromWei(balance.value), asset.minDecimals)}{' '}
            {asset.symbol}
          </p>
        </FormGroup>
        <Button text="Next" disabled={!valid} onClick={selectAmount} />
      </div>
      <h2>Bridge Limit Table</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Fee</td>
            <td>
              {toNumberFormat(
                asset.fromWei(limits.returnData.getFeePerToken),
                asset.minDecimals,
              )}{' '}
              {asset.symbol}
            </td>
          </tr>
          <tr>
            <td>Min Amount</td>
            <td>
              {toNumberFormat(
                asset.fromWei(limits.returnData.getMinPerToken),
                asset.minDecimals,
              )}{' '}
              {asset.symbol}
            </td>
          </tr>
          <tr>
            <td>Max Amount</td>
            <td>
              {toNumberFormat(
                fromWei(limits.returnData.getMaxTokensAllowed),
                asset.minDecimals,
              )}{' '}
              {asset.symbol}
            </td>
          </tr>
          <tr>
            <td>Daily Limit</td>
            <td>
              {toNumberFormat(
                fromWei(limits.returnData.dailyLimit),
                asset.minDecimals,
              )}{' '}
              {asset.symbol}
            </td>
          </tr>
          <tr>
            <td>Daily Limit Spent</td>
            <td>
              {toNumberFormat(
                fromWei(limits.returnData.spentToday),
                asset.minDecimals,
              )}{' '}
              {asset.symbol}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

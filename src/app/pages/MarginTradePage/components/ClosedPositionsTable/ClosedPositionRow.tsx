import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { translations } from 'locales/i18n';
import { Tooltip } from '@blueprintjs/core';
import { TradingPairDictionary } from 'utils/dictionaries/trading-pair-dictionary';
import { assetByTokenAddress } from 'utils/blockchain/contract-helpers';
import { TradingPosition } from 'types/trading-position';
import { toAssetNumberFormat } from 'utils/display-text/format';
import { PositionBlock } from '../PositionBlock';
import { LinkToExplorer } from 'app/components/LinkToExplorer';
import { AssetRenderer } from 'app/components/AssetRenderer';
import { TradeProfit } from 'app/components/TradeProfit';
import {
  getClosePositionPrice,
  getExitTransactionHash,
  getOpenPositionPrice,
} from '../../utils/marginUtils';
import { ActionButton } from 'app/components/Form/ActionButton';
import { PositionEventsTable } from '../PositionEventsTable';
import { LoanEvent } from '../../types';

type ClosedPositionRowProps = {
  event: LoanEvent;
};

export const ClosedPositionRow: React.FC<ClosedPositionRowProps> = ({
  event,
}) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const {
    trade: [{ positionSize, entryLeverage, entryPrice, transaction }],
    loanToken: { id: loanTokenId },
    collateralToken: { id: collateralTokenId },
    liquidates,
    closeWithSwaps,
  } = event;
  const loanAsset = assetByTokenAddress(loanTokenId);
  const collateralAsset = assetByTokenAddress(collateralTokenId);
  const pair = TradingPairDictionary.findPair(loanAsset, collateralAsset);

  const position =
    pair?.longAsset === loanAsset
      ? TradingPosition.LONG
      : TradingPosition.SHORT;

  const leverage = useMemo(() => Number(entryLeverage) + 1, [entryLeverage]);
  const openPrice = useMemo(() => getOpenPositionPrice(entryPrice, position), [
    entryPrice,
    position,
  ]);

  const closePrice = useMemo(
    () => getClosePositionPrice(liquidates, closeWithSwaps, position),
    [liquidates, closeWithSwaps, position],
  );

  const exitTransactionHash = useMemo(
    () => getExitTransactionHash(liquidates, closeWithSwaps),
    [liquidates, closeWithSwaps],
  );

  return (
    <>
      <tr>
        <td>
          <PositionBlock position={position} name={pair.name} />
        </td>
        <td className="tw-hidden xl:tw-table-cell">
          <div className="tw-whitespace-nowrap">
            <Tooltip
              content={
                <>
                  {positionSize} <AssetRenderer asset={collateralAsset} />
                </>
              }
            >
              <>
                {toAssetNumberFormat(positionSize, collateralAsset)}{' '}
                <AssetRenderer asset={pair.longDetails.asset} />
              </>
            </Tooltip>
          </div>
        </td>
        <td className="tw-hidden xl:tw-table-cell">
          <div>{leverage}x</div>
        </td>
        <td className="tw-hidden md:tw-table-cell">
          <div className="tw-whitespace-nowrap">
            <Tooltip
              content={
                <>
                  {openPrice} <AssetRenderer asset={pair.longDetails.asset} />
                </>
              }
            >
              <>
                {toAssetNumberFormat(openPrice, pair.longDetails.asset)}{' '}
                <AssetRenderer asset={pair.longDetails.asset} />
              </>
            </Tooltip>
          </div>
        </td>
        <td className="tw-hidden md:tw-table-cell">
          <div className="tw-whitespace-nowrap">
            <Tooltip
              content={
                <>
                  {closePrice} <AssetRenderer asset={pair.longDetails.asset} />
                </>
              }
            >
              <>
                {toAssetNumberFormat(closePrice, pair.longDetails.asset)}{' '}
                <AssetRenderer asset={pair.longDetails.asset} />
              </>
            </Tooltip>
          </div>
        </td>
        <td>
          <TradeProfit
            positionSize={positionSize}
            collateralAsset={collateralAsset}
            position={position}
            openPrice={openPrice}
            closePrice={closePrice}
          />
        </td>
        <td className="tw-hidden xl:tw-table-cell">
          <LinkToExplorer
            className="tw-text-primary tw-truncate tw-m-0"
            txHash={transaction.id}
            startLength={5}
            endLength={5}
          />
        </td>
        <td className="tw-hidden xl:tw-table-cell">
          <LinkToExplorer
            className="tw-text-primary tw-truncate tw-m-0"
            txHash={exitTransactionHash}
            startLength={5}
            endLength={5}
          />
        </td>
        <td>
          <div className="tw-flex tw-items-center tw-justify-end xl:tw-justify-around 2xl:tw-justify-start">
            <ActionButton
              text={t(translations.tradingHistoryPage.table.cta.details)}
              onClick={() => setShowDetails(!showDetails)}
              className="tw-border-none tw-ml-0 tw-pl-4 xl:tw-pl-2 tw-pr-0"
              textClassName="tw-text-xs tw-overflow-visible tw-font-bold"
              data-action-id="margin-openPositions-DetailsButton"
            />
          </div>
        </td>
      </tr>
      {showDetails && (
        <PositionEventsTable
          isOpenPosition={false}
          event={event}
          isLong={position === TradingPosition.LONG}
          position={position}
        />
      )}
    </>
  );
};

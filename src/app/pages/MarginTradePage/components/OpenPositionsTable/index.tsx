import React, { useCallback, useMemo, useState } from 'react';
import { SkeletonRow } from 'app/components/Skeleton/SkeletonRow';
import { OpenPositionRow } from './OpenPositionRow';
import { PendingPositionRow } from './PendingPositionRow';
import { Trans, useTranslation } from 'react-i18next';
import { translations } from '../../../../../locales/i18n';
import { Pagination } from '../../../../components/Pagination';
import { useMargin_GetLoans } from '../../hooks/useMargin_GetLoans';
import { useSelector } from 'react-redux';
import { selectTransactionArray } from 'store/global/transactions-store/selectors';
import { TxStatus, TxType } from 'store/global/transactions-store/types';
import { HelpBadge } from 'app/components/HelpBadge/HelpBadge';

export function OpenPositionsTable() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const transactions = useSelector(selectTransactionArray);
  const { events, loading, totalCount } = useMargin_GetLoans(page, true);
  const isEmpty = useMemo(
    () => !loading && !events?.length && !transactions.length,
    [loading, events, transactions],
  );
  const onPageChanged = useCallback(data => setPage(data.currentPage), []);
  const onGoingTransactions = useMemo(
    () =>
      transactions.length > 0 && (
        <>
          {transactions
            .filter(
              tx =>
                tx.type === TxType.TRADE &&
                [TxStatus.FAILED, TxStatus.PENDING].includes(tx.status),
            )
            .reverse()
            .map(item => (
              <PendingPositionRow key={item.transactionHash} item={item} />
            ))}
        </>
      ),
    [transactions],
  );

  return (
    <>
      <table className="tw-table tw-table-auto">
        <thead>
          <tr>
            <th>{t(translations.openPositionTable.direction)}</th>
            <th className="tw-hidden xl:tw-table-cell">
              {t(translations.openPositionTable.positionSize)}
            </th>
            <th className="tw-hidden xl:tw-table-cell">
              {t(translations.openPositionTable.entryPrice)}
            </th>
            <th className="tw-hidden md:tw-table-cell">
              {t(translations.openPositionTable.liquidationPrice)}
            </th>
            <th className="tw-hidden xl:tw-table-cell tw-whitespace-nowrap">
              <HelpBadge
                tooltip={
                  <Trans
                    i18nKey={
                      translations.openPositionTable.explainers.positionMargin
                    }
                    components={[<strong className="tw-font-bold" />]}
                  />
                }
              >
                {t(translations.openPositionTable.positionMargin)}
              </HelpBadge>
            </th>
            <th className="tw-hidden sm:tw-table-cell">
              {t(translations.openPositionTable.unrealizedPL)}
            </th>
            <th className="tw-hidden 2xl:tw-table-cell">
              {t(translations.openPositionTable.interestAPR)}
            </th>
            <th className="tw-hidden 2xl:tw-table-cell">
              {t(translations.openPositionTable.rolloverDate)}
            </th>
            <th className="tw-hidden 2xl:tw-table-cell">
              {t(translations.common.txHash)}
            </th>
            <th>{t(translations.openPositionTable.actions)}</th>
          </tr>
        </thead>
        <tbody>
          {isEmpty && (
            <tr>
              <td colSpan={99} className="tw-text-center">
                {t(translations.openPositionTable.noData)}
              </td>
            </tr>
          )}
          {onGoingTransactions}

          {loading && (
            <tr>
              <td colSpan={99}>
                <SkeletonRow />
              </td>
            </tr>
          )}

          {totalCount > 0 && (
            <>
              {events?.map(event => (
                <OpenPositionRow
                  key={event.loanId}
                  items={event.data}
                  nextRollover={event.nextRollover}
                />
              ))}
            </>
          )}
        </tbody>
      </table>

      {totalCount > 0 && (
        <Pagination
          totalRecords={totalCount}
          pageLimit={6}
          pageNeighbours={1}
          onChange={onPageChanged}
        />
      )}
    </>
  );
}

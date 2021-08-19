import { bignumber } from 'mathjs';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components/macro';

import { useAccount } from 'app/hooks/useAccount';
import { translations } from 'locales/i18n';
import { Chain } from 'types';
import { getContract } from 'utils/blockchain/contract-helpers';
import { LendingPoolDictionary } from 'utils/dictionaries/lending-pool-dictionary';

import { weiTo18 } from '../../../../../utils/blockchain/math-helpers';
import { ethGenesisAddress } from '../../../../../utils/classifiers';
import { LiquidityPoolDictionary } from '../../../../../utils/dictionaries/liquidity-pool-dictionary';
import { useGetContractPastEvents } from '../../../../hooks/useGetContractPastEvents';
import { bridgeNetwork } from '../../../BridgeDepositPage/utils/bridge-network';
import { ClaimForm } from '../ClaimForm';

export function LiquidForm() {
  const userAddress = useAccount();
  const { t } = useTranslation();
  const [liquidityRewards, setLiqRewards] = useState(0);
  const [lendingRewards, setLendingRewards] = useState(0);
  const rewardSov = useGetContractPastEvents('lockedSov', 'Deposited');
  console.log('rewardSov: ', rewardSov);
  useEffect(() => {
    const ammPools = LiquidityPoolDictionary.list().filter(
      item => item.hasSovRewards,
    );
    const lendingPools = LendingPoolDictionary.list().filter(
      item => item.useLM,
    );

    if (userAddress !== '' && userAddress !== ethGenesisAddress) {
      const pools = ammPools.flatMap(item =>
        item.version === 1
          ? [item.supplyAssets[0]]
          : [item.supplyAssets[0], item.supplyAssets[1]],
      );
      bridgeNetwork
        .multiCall<{ [key: string]: string }>(
          Chain.RSK,
          pools.flatMap((item, index) => {
            return [
              {
                address: getContract('liquidityMiningProxy').address,
                abi: getContract('liquidityMiningProxy').abi,
                fnName: 'getUserAccumulatedReward',
                args: [item.getContractAddress(), userAddress],
                key: `getUserAccumulatedReward_${index}_${item.asset}`,
                parser: value => value[0].toString(),
              },
              {
                address: getContract('liquidityMiningProxy').address,
                abi: getContract('liquidityMiningProxy').abi,
                fnName: 'getUserInfo',
                args: [item.getContractAddress(), userAddress],
                key: `getUserInfo_${index}_${item.asset}`,
                parser: value => value[0].accumulatedReward.toString(),
              },
            ];
          }),
        )
        .then(result => {
          console.log('result', result);
          const total = Object.values(result.returnData)
            .reduce(
              (previousValue, currentValue) => previousValue.add(currentValue),
              bignumber(0),
            )
            .toFixed(0);
          const rewards = parseFloat(weiTo18(total));
          setLiqRewards(rewards);
        })
        .catch(error => {
          console.error('e', error);
        });
      bridgeNetwork
        .multiCall<{ [key: string]: string }>(
          Chain.RSK,
          lendingPools.flatMap((item, index) => {
            return [
              {
                address: getContract('liquidityMiningProxy').address,
                abi: getContract('liquidityMiningProxy').abi,
                fnName: 'getUserAccumulatedReward',
                args: [
                  item.getAssetDetails().lendingContract.address,
                  userAddress,
                ],
                key: `getUserAccumulatedReward_${index}_${item.getAsset}`,
                parser: value => value[0].toString(),
              },
            ];
          }),
        )
        .then(result => {
          const total = Object.values(result.returnData)
            .reduce(
              (previousValue, currentValue) => previousValue.add(currentValue),
              bignumber(0),
            )
            .toFixed(0);
          const rewards = parseFloat(weiTo18(total));
          setLendingRewards(rewards);
        })
        .catch(error => {
          console.error('e', error);
        });
    }
  }, [userAddress]);
  return (
    <ContainerBox>
      <Box>
        <div className="tw-w-1/2 tw-flex tw-justify-center tw-align-center">
          <ClaimForm address={userAddress} />
        </div>
        <Divider />
        <div className="tw-w-1/2 tw-flex w-flex-row tw-justify-center tw-align-center">
          <div className="lg:tw-mr-5">
            <div className="tw-text-xs mb-2 tw-flex tw-items-center">
              <div className="tw-p-2 tw-bg-gold tw-mr-5"></div>
              50.00% - Liquidity Rewards
            </div>
            <div className="tw-text-xs mb-2 tw-flex tw-items-center">
              <div className="tw-p-2 tw-bg-white tw-mr-5"></div>
              16.66% - Lending Rewards
            </div>
            <div className="tw-text-xs mb-2 tw-flex tw-items-center">
              <div className="tw-p-2 tw-bg-green tw-mr-5"></div>
              33.33% - Trading Rewards
            </div>
          </div>
        </div>
      </Box>
      <RewardInfoBox>
        <div className="xl:tw-mx-1 tw-w-1/3 tw-bg-gray-800 tw-staking-box tw-p-4 tw-rounded-lg tw-text-sm tw-mb-4 lg:tw-mb-0">
          <InfoTitle>
            {t(translations.rewardPage.topData.referralRewards)}
          </InfoTitle>
          <div className="tw-flex tw-items-start">
            <div className="tw-p-2 tw-bg-gold tw-mr-5"></div>
            <div>
              <div className="mb-3">
                <InfoSubAvaTitle>
                  {t(translations.rewardPage.topData.availableRewards)}
                </InfoSubAvaTitle>
                <InfoContent>
                  {liquidityRewards.toFixed(6) + ' SOV'}
                </InfoContent>
              </div>
              <div className="mb-3">
                <InfoSubTotalTitle>
                  {t(translations.rewardPage.topData.totalRewards)}
                </InfoSubTotalTitle>
                <InfoSubTotalContent>73.5927 SOV</InfoSubTotalContent>
              </div>
            </div>
          </div>
        </div>
        <div className="xl:tw-mx-1 tw-w-1/3 tw-bg-gray-800 tw-staking-box tw-p-4 tw-rounded-lg tw-text-sm tw-mb-4 lg:tw-mb-0">
          <div className="tw-text-xl tw-font-semibold tw-mb-9">
            {t(translations.rewardPage.topData.stakingReward)}
          </div>
          <div className="tw-flex tw-items-start">
            <div className="tw-p-2 tw-bg-white tw-mr-5"></div>
            <div>
              <div className="mb-3">
                <InfoSubAvaTitle>
                  {t(translations.rewardPage.topData.availableRewards)}
                </InfoSubAvaTitle>
                <InfoContent>{lendingRewards.toFixed(6) + ' SOV'}</InfoContent>
              </div>
              <div className="mb-3">
                <InfoSubTotalTitle>
                  {t(translations.rewardPage.topData.totalRewards)}
                </InfoSubTotalTitle>
                <InfoSubTotalContent>73.5927 SOV</InfoSubTotalContent>
              </div>
            </div>
          </div>
        </div>
      </RewardInfoBox>
    </ContainerBox>
  );
}

const ContainerBox = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;
const Box = styled.div`
  background-color: #222222;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;
const InfoTitle = styled.div`
  color: '#E9EAE9';
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 2.25rem;
`;
const InfoContent = styled.div`
  color: '#E9EAE9';
  font-size: 20px;
  font-weight: 600;
`;
const InfoSubAvaTitle = styled.div`
  color: '#E9EAE9';
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 0.25rem;
`;
const InfoSubTotalTitle = styled.div`
  color: 'rgba(237,237,237,0.65)';
  font-size: 10px;
  font-weight: 500;
  margin-bottom: 0.25rem;
`;
const InfoSubTotalContent = styled.div`
  color: 'rgba(237,237,237,0.65)';
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 0.25rem;
`;
const RewardInfoBox = styled.div`
  /* background-color: #222222; */
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
  font-family: 'Montserrat';
`;
const Divider = styled.div`
  width: 0px;
  border-width: 1px;
  height: 150px;
  border-color: #e9eae9;
`;

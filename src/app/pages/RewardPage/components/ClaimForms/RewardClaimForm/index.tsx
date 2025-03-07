import React from 'react';
import { Trans } from 'react-i18next';

import { translations } from 'locales/i18n';
import { useClaimRewardSov } from './hooks/useClaimRewardSov';
import { BaseClaimForm } from '../BaseClaimForm';
import { IClaimFormProps } from '../BaseClaimForm/types';
import { useMaintenance } from 'app/hooks/useMaintenance';
import { useContractPauseState } from 'app/hooks/useContractPauseState';

export const RewardClaimForm: React.FC<IClaimFormProps> = ({
  className,
  amountToClaim,
}) => {
  const { checkMaintenance, States } = useMaintenance();
  const claimRewardSovLocked = checkMaintenance(States.CLAIM_REWARD_SOV);
  const { send, ...tx } = useClaimRewardSov();
  const { paused, frozen } = useContractPauseState('staking'); // underlying Reward SOV claiming contract uses staking contract so must be disabled
  return (
    <>
      <BaseClaimForm
        className={className}
        amountToClaim={amountToClaim}
        tx={tx}
        footer={<Footer />}
        onSubmit={send}
        claimLocked={claimRewardSovLocked || paused || frozen}
        dataActionId="revardsovButton"
      />
    </>
  );
};

const Footer: React.FC = () => (
  <>
    <Trans i18nKey={translations.rewardPage.claimForm.note} />{' '}
    <a
      href="https://wiki.sovryn.app/en/sovryn-dapp/sovryn-rewards-explained"
      target="_blank"
      rel="noreferrer noopener"
      className="tw-text-secondary tw-underline"
      data-action-id="rewards-rewardsov-learnmore"
    >
      <Trans i18nKey={translations.rewardPage.claimForm.learn} />
    </a>
  </>
);

'use client'

import { useChain } from 'hooks/useChain'
import { useTranslations } from 'next-intl'
import { EvmToken } from 'types/token'
import { EvmDepositOperation, EvmDepositStatus } from 'types/tunnel'
import { formatGasFees } from 'utils/format'
import { getNativeToken, getTokenByAddress, isNativeToken } from 'utils/token'
import { formatUnits } from 'viem'

import { EvmDepositProvider } from '../../_context/evmDepositContext'
import { useDeposit } from '../../_hooks/useDeposit'
import { RetryEvmDeposit } from '../retryEvmDeposit'

import { Operation } from './operation'
import { ProgressStatus } from './progressStatus'
import { type StepPropsWithoutPosition } from './step'

const getCallToAction = (deposit: EvmDepositOperation) =>
  deposit.status === EvmDepositStatus.DEPOSIT_TX_FAILED ? (
    <RetryEvmDeposit deposit={deposit} />
  ) : null

type Props = {
  deposit: EvmDepositOperation
  onClose: () => void
}

const ReviewContent = function ({ deposit, onClose }: Props) {
  const fromToken = getTokenByAddress(
    deposit.l1Token,
    deposit.l1ChainId,
  ) as EvmToken

  // L2 native tunneled token is on a special address, so it is easier to get the native token
  const toToken = (
    isNativeToken(fromToken)
      ? getNativeToken(deposit.l2ChainId)
      : getTokenByAddress(deposit.l2Token, deposit.l2ChainId)
  ) as EvmToken

  const depositStatus = deposit.status ?? EvmDepositStatus.DEPOSIT_TX_CONFIRMED

  const fromChain = useChain(deposit.l1ChainId)

  const { approvalTokenGasFees, depositGasFees } = useDeposit({
    // this is just for  fees estimation, so we just assume it's true unless deposit is confirmed
    canDeposit: depositStatus !== EvmDepositStatus.DEPOSIT_TX_CONFIRMED,
    fromInput: formatUnits(BigInt(deposit.amount), fromToken.decimals),
    fromToken,
    toToken,
  })
  const t = useTranslations('tunnel-page.review-deposit')

  const steps: StepPropsWithoutPosition[] = []

  const getApprovalStep = (): StepPropsWithoutPosition => ({
    description:
      depositStatus >= EvmDepositStatus.APPROVAL_TX_COMPLETED
        ? t('approve-confirmed')
        : t('approve-initiated'),
    explorerChainId: deposit.l1ChainId,
    fees:
      depositStatus === EvmDepositStatus.APPROVAL_TX_PENDING
        ? {
            amount: formatGasFees(
              approvalTokenGasFees,
              fromChain.nativeCurrency.decimals,
            ),
            symbol: fromChain.nativeCurrency.symbol,
          }
        : undefined,
    status:
      depositStatus >= EvmDepositStatus.APPROVAL_TX_COMPLETED
        ? ProgressStatus.COMPLETED
        : ProgressStatus.PROGRESS,
    txHash: deposit.approvalTxHash,
  })

  const getDepositStep = function (): StepPropsWithoutPosition {
    const statusMap = {
      [EvmDepositStatus.APPROVAL_TX_COMPLETED]: ProgressStatus.READY,
      [EvmDepositStatus.APPROVAL_TX_PENDING]: ProgressStatus.NOT_READY,
      [EvmDepositStatus.DEPOSIT_TX_CONFIRMED]: ProgressStatus.COMPLETED,
      [EvmDepositStatus.DEPOSIT_TX_FAILED]: ProgressStatus.FAILED,
      [EvmDepositStatus.DEPOSIT_TX_PENDING]: ProgressStatus.PROGRESS,
    }
    return {
      description:
        depositStatus === EvmDepositStatus.DEPOSIT_TX_CONFIRMED
          ? t('deposit-completed')
          : t('initiate-deposit'),
      explorerChainId: deposit.l1ChainId,
      fees: [
        EvmDepositStatus.APPROVAL_TX_COMPLETED,
        EvmDepositStatus.DEPOSIT_TX_PENDING,
        EvmDepositStatus.DEPOSIT_TX_FAILED,
      ].includes(depositStatus)
        ? {
            amount: formatGasFees(
              depositGasFees,
              fromChain.nativeCurrency.decimals,
            ),
            symbol: fromChain.nativeCurrency.symbol,
          }
        : undefined,
      status: statusMap[depositStatus],
      txHash: deposit.transactionHash,
    }
  }

  // Show the approval only if it's a not native token and there is a approval.
  // Note that for past re-sync transactions, the approvalHash won't be available,
  // as we can't see if a user has approved a token before the actual deposit (they are different transactions
  // and for the time being it's not worth to scan the user wallet)
  if (!isNativeToken(fromToken) && deposit.approvalTxHash) {
    steps.push(getApprovalStep())
  }

  steps.push(getDepositStep())

  return (
    <Operation
      amount={deposit.amount}
      callToAction={getCallToAction(deposit)}
      onClose={onClose}
      steps={steps}
      subtitle={
        depositStatus === EvmDepositStatus.DEPOSIT_TX_CONFIRMED
          ? t('your-deposit-is-complete')
          : t('deposit-on-its-way')
      }
      title={t('review-deposit')}
      token={fromToken}
    />
  )
}

export const ReviewEvmDeposit = ({ deposit, onClose }: Props) => (
  <EvmDepositProvider>
    <ReviewContent deposit={deposit} onClose={onClose} />
  </EvmDepositProvider>
)
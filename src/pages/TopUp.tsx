import TopupManager from "../components/topup/TopupManager";

interface TopUpProps {
  topUpType: string;
}

export default function TopUp({ topUpType }: TopUpProps) {
  return <TopupManager topUpType={topUpType} />;
}

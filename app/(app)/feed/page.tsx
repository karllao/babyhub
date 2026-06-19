import BottleForm from "@/components/BottleForm";
import BreastfeedTimer from "@/components/BreastfeedTimer";
import PageHeader from "@/components/PageHeader";

type SP = { type?: string; content?: string };

export default function FeedPage({ searchParams }: { searchParams: SP }) {
  const type = searchParams.type === "breast" ? "breast" : "bottle";
  const content = searchParams.content === "breastmilk" ? "breastmilk" : "formula";

  return (
    <>
      <PageHeader title={type === "breast" ? "亲喂计时" : "瓶喂记录"} />
      {type === "breast" ? <BreastfeedTimer /> : <BottleForm defaultContent={content} />}
    </>
  );
}

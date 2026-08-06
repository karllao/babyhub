import BottleForm from "@/components/BottleForm";
import PageHeader from "@/components/PageHeader";

export default function FeedPage() {
  return (
    <>
      <PageHeader title="喂奶记录" />
      <BottleForm defaultContent="formula" />
    </>
  );
}

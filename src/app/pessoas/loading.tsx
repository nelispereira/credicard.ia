import { PageSkeleton } from "@/components/PageSkeleton";

export default function Loading() {
  return <PageSkeleton titleWidth="w-24" layout="list" rows={5} />;
}

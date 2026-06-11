import { PageSkeleton } from "@/components/PageSkeleton";

export default function Loading() {
  return <PageSkeleton titleWidth="w-48" layout="table" rows={6} />;
}

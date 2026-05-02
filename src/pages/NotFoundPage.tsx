import { ErrorState } from "../components/ErrorState";
import type { AppRoute } from "../data/routes";

type NotFoundPageProps = {
  onNavigate: (route: AppRoute) => void;
};

export function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return (
    <ErrorState
      title="哎呀，这节课走丢了"
      description="请返回老师首页，或者重新打开课堂链接。"
      primaryLabel="返回首页"
      secondaryLabel="学生输入 PIN 加入课堂"
      onPrimary={() => onNavigate("teacher-dashboard")}
      onSecondary={() => onNavigate("student")}
    />
  );
}

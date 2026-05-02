import { ErrorState } from "../components/ErrorState";
import type { AppRoute } from "../data/routes";

type LessonLoadErrorPageProps = {
  onNavigate: (route: AppRoute) => void;
};

export function LessonLoadErrorPage({ onNavigate }: LessonLoadErrorPageProps) {
  return (
    <ErrorState
      title="课件加载失败，请检查链接或联系老师"
      description="如果是从微信群或家长群打开，请重新复制课堂链接，或向老师确认课堂 PIN 码。"
      primaryLabel="重新加载"
      secondaryLabel="返回学生加入页"
      onPrimary={() => window.location.reload()}
      onSecondary={() => onNavigate("student")}
    />
  );
}

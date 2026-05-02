import { useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Mascot } from "../components/Mascot";
import { mockClass, mockSession } from "../data/mockClassData";
import type { AppRoute } from "../data/routes";

type StudentJoinProps = {
  onNavigate: (route: AppRoute) => void;
  onJoinStudent: (nickname: string) => void;
};

export function StudentJoin({ onNavigate, onJoinStudent }: StudentJoinProps) {
  const [nickname, setNickname] = useState("小星星");
  const [pin, setPin] = useState(mockSession.pin);
  const [joined, setJoined] = useState(false);
  const [joinMessage, setJoinMessage] = useState("输入昵称和课堂 PIN 码后即可加入。");

  const joinClass = () => {
    if (!nickname.trim()) {
      setJoinMessage("请先输入你的昵称。");
      return;
    }

    if (pin.trim() !== mockSession.pin) {
      setJoinMessage("课堂 PIN 不正确，请向老师确认");
      return;
    }

    setJoinMessage("加入成功，准备开始闯关。");
    onJoinStudent(nickname);
    setJoined(true);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-skybrand sm:text-6xl">学生端加入页</h1>
          <p className="mt-3 text-xl font-bold text-ink">
            无需下载，点链接或扫码即可进入课堂
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {["3秒进入", "无需注册", "链接直达"].map((tag, index) => (
            <div
              key={tag}
              className={[
                "rounded-3xl px-5 py-4 text-center text-lg font-black shadow-lg",
                index === 0
                  ? "bg-violet-100 text-violetbrand"
                  : index === 1
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-blue-100 text-skybrand"
              ].join(" ")}
            >
              {["⚡", "👤", "🔗"][index]} {tag}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1fr_1fr] xl:items-center">
        <div className="flex justify-center gap-6">
          <div className="phone-frame p-5 pt-14">
            <div className="flex min-h-[520px] flex-col justify-between rounded-[30px] bg-gradient-to-b from-sky-300 to-emerald-200 p-5">
              <div className="text-center">
                <div className="mx-auto flex justify-center">
                  <Mascot size={104} />
                </div>
                <h2 className="mt-2 text-3xl font-black text-white drop-shadow-[0_3px_0_rgba(47,123,255,0.5)]">
                  欢迎来到分数闯关挑战
                </h2>
              </div>

              {!joined ? (
                <form className="space-y-4 rounded-3xl bg-white/92 p-5 shadow-xl" onSubmit={(event) => {
                  event.preventDefault();
                  joinClass();
                }}>
                  <label className="block">
                    <span className="mb-2 block text-sm font-black text-slate-600">输入昵称</span>
                    <input
                      className="min-h-14 w-full rounded-2xl border border-blue-100 px-4 text-lg font-black outline-none focus:border-skybrand focus:ring-4 focus:ring-blue-100"
                      value={nickname}
                      onChange={(event) => setNickname(event.target.value)}
                      placeholder="请输入你的昵称"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-black text-slate-600">
                      选择班级 / 输入 PIN 码
                    </span>
                    <input
                      className="min-h-14 w-full rounded-2xl border border-blue-100 px-4 text-lg font-black outline-none focus:border-skybrand focus:ring-4 focus:ring-blue-100"
                      value={pin}
                      onChange={(event) => setPin(event.target.value)}
                      placeholder="请输入班级 PIN 码"
                    />
                  </label>
                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    variant="sun"
                  >
                    立即加入
                  </Button>
                  <p className="text-sm font-bold leading-6 text-slate-700">
                    课游小熊提醒：同学们请使用昵称加入课堂，不要填写手机号、家庭住址等个人信息。
                  </p>
                  <p className="rounded-2xl bg-blue-50 p-3 text-sm font-black text-slate-600">
                    {joinMessage}
                  </p>
                </form>
              ) : (
                <div className="rounded-3xl bg-white/94 p-5 text-center shadow-xl">
                  <div className="text-5xl">🎉</div>
                  <h2 className="mt-2 text-3xl font-black text-skybrand">加入成功！</h2>
                  <div className="mt-4 space-y-3 text-left">
                    <InfoRow label="昵称" value={nickname} icon="👤" />
                    <InfoRow label="班级" value="三年级（2）班" icon="👥" />
                  </div>
                  <Button className="mt-5" fullWidth size="lg" onClick={() => onNavigate("play")}>
                    开始闯关
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <Card className="p-8">
          <div className="flex flex-wrap items-center gap-6">
            <Mascot size={160} />
            <div className="min-w-0 flex-1">
              <h2 className="text-3xl font-black text-ink">学生点链接即参与</h2>
              <p className="mt-3 text-lg font-semibold leading-8 text-slate-600">
                课堂链接、二维码、PIN 码三种入口并行，适配微信群、家长群和投屏课堂。孩子不用下载 App，不需要注册，打开就能玩。
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["入口轻", "3 秒进入课堂", "⚡"],
              ["成本低", "无需账号密码", "🔓"],
              ["反馈快", "老师实时看进度", "📊"]
            ].map(([title, text, icon]) => (
              <div key={title} className="rounded-3xl bg-blue-50 p-5 text-center">
                <div className="text-4xl">{icon}</div>
                <p className="mt-2 text-xl font-black text-ink">{title}</p>
                <p className="mt-1 text-sm font-bold text-slate-500">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-3xl bg-gradient-to-r from-yellow-100 to-orange-100 p-5">
            <p className="text-lg font-black text-ink">
              当前课堂：分数闯关挑战 · {mockClass.name} · PIN {mockSession.pin}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-blue-50 px-4 py-3">
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-black text-slate-500">{label}：</span>
      <span className="font-black text-ink">{value}</span>
    </div>
  );
}

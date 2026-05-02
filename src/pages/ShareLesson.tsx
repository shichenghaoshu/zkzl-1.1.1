import { useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Mascot } from "../components/Mascot";
import { QRCodeMock } from "../components/QRCodeMock";
import { mockClass, mockSession } from "../data/mockClassData";
import { mockLesson, type Lesson } from "../data/mockLessons";
import type { AppRoute } from "../data/routes";
import { downloadQrSvg } from "../services/qrCode";

type ShareLessonProps = {
  lesson: Lesson | null;
  onNavigate: (route: AppRoute) => void;
};

export function ShareLesson({ lesson, onNavigate }: ShareLessonProps) {
  const [copied, setCopied] = useState("尚未复制");
  const [published, setPublished] = useState(false);
  const [qrDownloading, setQrDownloading] = useState(false);
  const activeLesson = lesson ?? mockLesson;
  const shareUrl = `https://savegpa.online/play?lesson=${activeLesson.id.replace(/[^a-zA-Z0-9]/g, "").slice(-8) || "abc123"}`;

  const markCopied = async (text: string, value?: string) => {
    if (value) {
      await copyText(value);
    }
    setCopied(text);
  };

  const downloadQr = async () => {
    try {
      setQrDownloading(true);
      await downloadQrSvg(shareUrl, activeLesson.title);
      setCopied("二维码已下载，可直接发到微信群或投到大屏。");
    } catch {
      setCopied("二维码下载失败，请先复制课堂链接发给学生。");
    } finally {
      setQrDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-skybrand sm:text-6xl">快速分享与班级发布</h1>
          <p className="mt-3 text-xl font-bold text-ink">
            生成后立即发到班级，支持链接、二维码、PIN码
          </p>
        </div>
        <Mascot size={120} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
        <Card className="p-5 sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-ink">分享课堂：{activeLesson.title}</h2>
              <p className="mt-2 font-bold text-slate-500">
                老师快速分享，学生点链接即参与，课堂反馈实时进入报告。
              </p>
            </div>
            <span className="hidden text-4xl sm:block">📨</span>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card tone="blue" className="p-5 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-skybrand text-3xl text-white shadow-lg">
                🔗
              </div>
              <h3 className="mt-4 text-xl font-black text-ink">复制链接</h3>
              <p className="mt-3 break-all rounded-2xl bg-white px-3 py-3 text-sm font-bold text-skybrand">
                {shareUrl}
              </p>
              <Button className="mt-4" variant="secondary" onClick={() => void markCopied("链接已复制", shareUrl)}>
                复制
              </Button>
            </Card>

            <Card tone="mint" className="p-5 text-center">
              <div className="mx-auto flex justify-center">
                <QRCodeMock value={shareUrl} title={`${activeLesson.title}课堂二维码`} />
              </div>
              <h3 className="mt-4 text-xl font-black text-ink">下载二维码</h3>
              <Button className="mt-4" variant="mint" onClick={() => void downloadQr()} disabled={qrDownloading}>
                {qrDownloading ? "正在生成" : "下载保存"}
              </Button>
            </Card>

            <Card tone="violet" className="p-5 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-violetbrand text-3xl text-white shadow-lg">
                🔒
              </div>
              <h3 className="mt-4 text-xl font-black text-ink">课堂 PIN 码</h3>
              <p className="mt-3 rounded-3xl bg-white px-4 py-4 text-4xl font-black tracking-[0.18em] text-violetbrand shadow-inner">
                {mockSession.pin}
              </p>
              <Button className="mt-4" variant="white" onClick={() => void markCopied("PIN 码已复制", mockSession.pin)}>
                复制 PIN 码
              </Button>
            </Card>
          </div>

          <div className="mt-6 grid gap-4 rounded-3xl bg-gradient-to-r from-blue-50 to-emerald-50 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
            <label>
              <span className="mb-2 block text-sm font-black text-slate-600">发布到班级</span>
              <select className="min-h-14 w-full rounded-2xl border border-blue-100 bg-white px-4 text-lg font-black text-ink outline-none">
                <option>{mockClass.name} · {activeLesson.scenes.length} 关</option>
              </select>
            </label>
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setPublished(true);
                void markCopied("已发布到三年级2班");
              }}
            >
              🚀 班级发布
            </Button>
            <Button variant="mint" size="lg" onClick={() => onNavigate("student")}>
              ▶ 开始上课
            </Button>
          </div>

          <div className="mt-4 rounded-3xl bg-white/76 p-4 text-sm font-black text-slate-600 shadow-inner">
            {published ? "已成功发布到三年级2班，学生可通过链接、二维码或 PIN 码进入课堂。" : copied}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="relative overflow-hidden p-5">
            <div className="mx-auto phone-frame min-h-[560px] p-5 pt-12">
              <div className="rounded-3xl bg-white/88 p-4 shadow-xl">
                <p className="text-center text-sm font-black text-slate-600">三年级2班家长群</p>
                <div className="mt-4 rounded-3xl bg-white p-4 shadow-md">
                  <div className="text-sm font-bold text-slate-500">课游AI</div>
                  <h3 className="mt-2 text-2xl font-black text-ink">{activeLesson.title}</h3>
                  <p className="mt-1 font-bold text-slate-500">点击进入课堂互动</p>
                  <div className="mt-4 flex h-36 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-300 to-amber-200 text-6xl">
                    🏆⭐🧸
                  </div>
                  <p className="mt-3 text-sm font-black text-skybrand">🔗 点击链接进入课堂</p>
                </div>
              </div>
            </div>
          </Card>

          <Card tone="sun">
            <h3 className="text-2xl font-black text-skybrand">分享优势</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {["微信群", "家长群", "扫码进课", "投屏同步"].map((item, index) => (
                <div key={item} className="rounded-2xl bg-white/80 p-4 text-center font-black text-ink">
                  <span className="mr-2">{["💬", "👪", "📷", "🖥️"][index]}</span>
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const input = document.createElement("textarea");
    input.value = value;
    input.setAttribute("readonly", "true");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }
}

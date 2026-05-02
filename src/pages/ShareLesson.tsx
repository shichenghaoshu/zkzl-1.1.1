import { useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { QRCodeMock } from "../components/QRCodeMock";
import { mockClass, mockSession } from "../data/mockClassData";
import { mockLesson, type Lesson } from "../data/mockLessons";
import type { AppRoute } from "../data/routes";
import { downloadQrSvg } from "../services/qrCode";

type ShareLessonProps = {
  lesson: Lesson | null;
  onNavigate: (route: AppRoute) => void;
};

type ShareTab = "link" | "qr" | "pin" | "publish";

const tabs: Array<{ key: ShareTab; label: string; icon: string }> = [
  { key: "link", label: "链接", icon: "🔗" },
  { key: "qr", label: "二维码", icon: "📷" },
  { key: "pin", label: "PIN", icon: "🔒" },
  { key: "publish", label: "班级发布", icon: "🚀" },
];

export function ShareLesson({ lesson, onNavigate }: ShareLessonProps) {
  const [activeTab, setActiveTab] = useState<ShareTab>("link");
  const [copied, setCopied] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [qrDownloading, setQrDownloading] = useState(false);
  const activeLesson = lesson ?? mockLesson;
  const shareUrl = `https://savegpa.online/play?lesson=${activeLesson.id.replace(/[^a-zA-Z0-9]/g, "").slice(-8) || "abc123"}`;

  const markCopied = async (text: string, value?: string) => {
    if (value) await copyText(value);
    setCopied(text);
    setTimeout(() => setCopied(null), 2500);
  };

  const downloadQr = async () => {
    try {
      setQrDownloading(true);
      await downloadQrSvg(shareUrl, activeLesson.title);
      setCopied("二维码已下载");
    } catch {
      setCopied("下载失败，请先复制链接");
    } finally {
      setQrDownloading(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-skybrand sm:text-5xl">分享课堂</h1>
          <p className="mt-2 text-lg font-bold text-ink">{activeLesson.title}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="mint" onClick={() => onNavigate("student")}>开始上课</Button>
          <Button variant="secondary" onClick={() => onNavigate("editor")}>编辑课件</Button>
        </div>
      </section>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-2xl bg-blue-50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={[
              "flex-1 rounded-xl px-3 py-2.5 text-sm font-black transition-all",
              activeTab === tab.key
                ? "bg-white text-skybrand shadow-md"
                : "text-slate-500 hover:bg-white/50"
            ].join(" ")}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <Card className="p-5">
        {activeTab === "link" && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-ink">分享链接</h2>
            <p className="text-sm font-bold text-slate-500">学生点击链接即可进入课堂互动</p>
            <div className="rounded-2xl bg-blue-50 p-4 break-all text-sm font-bold text-skybrand">
              {shareUrl}
            </div>
            <Button variant="primary" fullWidth onClick={() => void markCopied("链接已复制", shareUrl)}>
              复制链接
            </Button>

            {/* Quick presets */}
            <div className="border-t border-slate-100 pt-4">
              <p className="mb-3 text-sm font-black text-slate-600">快速发送到</p>
              <div className="grid grid-cols-2 gap-2">
                {sharePresets.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => void markCopied(
                      `${preset.label}文案已复制`,
                      preset.copyText({ url: shareUrl, title: activeLesson.title, pin: mockSession.pin })
                    )}
                    className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-white px-3 py-3 text-left text-sm font-bold text-ink transition hover:border-skybrand hover:bg-blue-50"
                  >
                    <span className="text-xl">{preset.icon}</span>
                    <span>
                      <span className="block font-black">{preset.label}</span>
                      <span className="block text-xs text-slate-400">{preset.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "qr" && (
          <div className="space-y-4 text-center">
            <h2 className="text-xl font-black text-ink">课堂二维码</h2>
            <p className="text-sm font-bold text-slate-500">学生扫码即可进入，适合投屏或打印</p>
            <div className="flex justify-center">
              <QRCodeMock value={shareUrl} title={`${activeLesson.title}课堂二维码`} />
            </div>
            <Button variant="mint" fullWidth onClick={() => void downloadQr()} disabled={qrDownloading}>
              {qrDownloading ? "正在生成..." : "下载二维码 SVG"}
            </Button>
            <Button variant="white" fullWidth onClick={() => void markCopied("链接已复制", shareUrl)}>
              复制链接（备选）
            </Button>
          </div>
        )}

        {activeTab === "pin" && (
          <div className="space-y-4 text-center">
            <h2 className="text-xl font-black text-ink">课堂 PIN 码</h2>
            <p className="text-sm font-bold text-slate-500">学生在加入页面输入 PIN 进入课堂</p>
            <div className="rounded-3xl bg-gradient-to-br from-violet-100 to-sky-50 px-6 py-8">
              <p className="text-6xl font-black tracking-[0.2em] text-violetbrand">{mockSession.pin}</p>
            </div>
            <Button variant="primary" fullWidth onClick={() => void markCopied("PIN 已复制", mockSession.pin)}>
              复制 PIN 码
            </Button>

            <div className="border-t border-slate-100 pt-4 text-left">
              <p className="mb-2 text-sm font-black text-slate-600">使用场景</p>
              <div className="space-y-2">
                {pinPresets.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => void markCopied(`${preset.label}文案已复制`, preset.copyText(mockSession.pin, activeLesson.title))}
                    className="flex w-full items-center gap-3 rounded-2xl border border-blue-100 bg-white px-3 py-3 text-left text-sm transition hover:border-skybrand hover:bg-blue-50"
                  >
                    <span className="text-xl">{preset.icon}</span>
                    <div>
                      <p className="font-black text-ink">{preset.label}</p>
                      <p className="text-xs text-slate-400">{preset.hint}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "publish" && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-ink">班级发布</h2>
            <p className="text-sm font-bold text-slate-500">发布后学生可通过任意方式进入课堂</p>

            <div className="rounded-2xl bg-blue-50 p-4">
              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-600">选择班级</span>
                <select className="min-h-12 w-full rounded-2xl border border-blue-100 bg-white px-4 font-black text-ink outline-none">
                  <option>{mockClass.name} · {activeLesson.scenes.length} 关</option>
                </select>
              </label>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => {
                setPublished(true);
                void markCopied("已发布到三年级2班");
              }}
            >
              {published ? "已发布" : "发布到班级"}
            </Button>

            {published && (
              <div className="rounded-2xl border-2 border-mintbrand bg-emerald-50 p-4">
                <p className="font-black text-emerald-700">已发布到 {mockClass.name}</p>
                <p className="mt-1 text-sm font-bold text-slate-600">
                  学生可通过链接、二维码或 PIN ({mockSession.pin}) 进入课堂
                </p>
                <div className="mt-3 flex gap-2">
                  <Button variant="mint" size="sm" onClick={() => onNavigate("student")}>
                    开始上课
                  </Button>
                  <Button variant="white" size="sm" onClick={() => onNavigate("report")}>
                    查看报告
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Status bar */}
      {copied && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-black text-emerald-700 text-center">
          {copied}
        </div>
      )}
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

const sharePresets = [
  {
    label: "微信群",
    icon: "💬",
    hint: "一键复制课堂链接",
    copyText: ({ url, title }: SharePresetPayload) =>
      `【课游AI课堂】${title}\n点击进入互动课堂：${url}\n学生参与闯关，数据实时同步到老师报告。`
  },
  {
    label: "家长群",
    icon: "👪",
    hint: "家长友好的通知",
    copyText: ({ url, title }: SharePresetPayload) =>
      `各位家长好！今天的互动课堂已准备好：${title}\n请让孩子点击链接参与：${url}\n闯关学习，寓教于乐。`
  },
  {
    label: "投屏大屏",
    icon: "🖥️",
    hint: "适合教室投影",
    copyText: ({ url }: SharePresetPayload) => url
  },
  {
    label: "课堂 PIN",
    icon: "🔒",
    hint: "PIN 码加入",
    copyText: ({ pin, title }: SharePresetPayload) =>
      `课堂：${title}\n加入方式：打开课游AI → 输入 PIN ${pin} → 开始闯关`
  }
];

type SharePresetPayload = {
  url: string;
  title: string;
  pin: string;
};

const pinPresets = [
  {
    label: "课堂口令",
    icon: "📢",
    hint: "直接报 PIN 让学生输入",
    copyText: (pin: string, title: string) =>
      `${title} 的课堂 PIN 是 ${pin}，请同学们打开课游AI输入 PIN 加入。`
  },
  {
    label: "微信群通知",
    icon: "💬",
    hint: "复制含 PIN 的通知",
    copyText: (pin: string, title: string) =>
      `课堂 PIN：${pin}\n${title}\n打开课游AI输入 PIN 即可加入互动课堂。`
  }
];

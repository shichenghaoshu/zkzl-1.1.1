import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Mascot } from "../components/Mascot";

const faqs = [
  ["学生需要下载 App 吗？", "不需要。学生点链接、扫码或输入 PIN 码即可进入课堂。"],
  ["学生需要注册账号吗？", "不需要。学生可以使用昵称临时加入课堂。"],
  ["老师如何把课件发到班级群？", "在「快速分享」页面复制链接、下载二维码，或使用课堂 PIN 码发到微信群。"],
  ["邀请码无效怎么办？", "请检查输入是否正确，或联系管理员生成新的邀请码。"],
  ["学生打不开链接怎么办？", "可以让学生重新扫码、输入 PIN 码，或检查网络是否正常。"],
  ["AI 生成的题目一定正确吗？", "AI 生成内容仅作为辅助，老师上课前应预览并检查题目和答案。"],
  ["可以导入 PPT 或 PDF 吗？", "当前体验版可展示入口，正式版支持导入已有课件并转换成互动游戏课件。"],
  ["可以用于希沃白板吗？", "可以通过浏览器打开链接，也可以投屏展示二维码和课堂页面。"]
];

export function HelpCenter() {
  const [message, setMessage] = useState("请尽量描述你遇到的课堂链接、二维码、PIN 码或生成问题。");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const records = JSON.parse(window.localStorage.getItem("keyou-feedback-records") || "[]") as unknown[];
    records.unshift({
      identity: formData.get("identity"),
      type: formData.get("type"),
      contact: formData.get("contact"),
      description: formData.get("description"),
      createdAt: new Date().toLocaleString("zh-CN", { hour12: false })
    });
    window.localStorage.setItem("keyou-feedback-records", JSON.stringify(records.slice(0, 30)));
    setMessage("已收到反馈，我们会尽快处理。");
    event.currentTarget.reset();
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-skybrand sm:text-6xl">帮助中心</h1>
          <p className="mt-3 max-w-3xl text-lg font-bold leading-8 text-ink">
            面向小学老师的使用说明：课堂链接、二维码、PIN 码、班级反馈都可以从这里找到帮助。
          </p>
        </div>
        <Mascot size={124} label="课游" />
      </section>

      <Card className="p-6">
        <h2 className="text-2xl font-black text-ink">快速开始</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          {["输入知识点", "生成互动游戏课件", "复制链接或二维码分享给学生", "查看班级数据反馈"].map((text, index) => (
            <div key={text} className="rounded-3xl bg-blue-50 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl font-black text-skybrand shadow-sm">
                {index + 1}
              </div>
              <p className="mt-3 text-lg font-black text-ink">第{["一", "二", "三", "四"][index]}步</p>
              <p className="mt-1 text-base font-bold leading-7 text-slate-700">{text}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
        <Card className="p-6">
          <h2 className="text-2xl font-black text-ink">常见问题</h2>
          <div className="mt-4 space-y-3">
            {faqs.map(([question, answer]) => (
              <details key={question} className="rounded-2xl bg-white p-4 shadow-sm">
                <summary className="cursor-pointer text-base font-black text-ink focus:outline-none focus:ring-4 focus:ring-blue-200">
                  {question}
                </summary>
                <p className="mt-3 text-base font-bold leading-7 text-slate-700">{answer}</p>
              </details>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          <Card tone="mint" className="p-6">
            <h2 className="text-2xl font-black text-ink">联系客服</h2>
            <p className="mt-3 text-base font-bold leading-8 text-slate-700">
              邮箱：support@keyouai.com<br />
              微信客服：课游AI助手<br />
              工作时间：工作日 9:00 - 18:00
            </p>
          </Card>

          <Card tone="sun" className="p-6">
            <h2 className="text-2xl font-black text-ink">提交反馈</h2>
            <form className="mt-4 space-y-4" onSubmit={submit}>
              <Field label="你的身份">
                <select name="identity" className="form-control">
                  <option>小学老师</option>
                  <option>教培老师</option>
                  <option>机构负责人</option>
                  <option>其他</option>
                </select>
              </Field>
              <Field label="问题类型">
                <select name="type" className="form-control">
                  <option>使用问题</option>
                  <option>功能建议</option>
                  <option>Bug反馈</option>
                  <option>商务合作</option>
                </select>
              </Field>
              <Field label="联系方式">
                <input name="contact" className="form-control" placeholder="手机号、微信或邮箱" />
              </Field>
              <Field label="问题描述">
                <textarea name="description" className="form-control min-h-28 resize-y" placeholder="请描述你遇到的问题" />
              </Field>
              <Button type="submit" fullWidth size="lg">提交反馈</Button>
              <p className="rounded-2xl bg-white/80 p-3 text-sm font-black text-slate-700">{message}</p>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700">{label}</span>
      {children}
    </label>
  );
}

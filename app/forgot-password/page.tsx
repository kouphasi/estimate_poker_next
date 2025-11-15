import Link from "next/link";
import ForgotPasswordForm from "@/app/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            パスワードリセット
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            パスワードを忘れた場合は、こちらからリセットできます
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <ForgotPasswordForm />
        </div>

        <div className="text-center space-y-2">
          <Link
            href="/login"
            className="block text-sm text-gray-600 hover:text-gray-900"
          >
            ログインページに戻る
          </Link>
          <Link
            href="/"
            className="block text-sm text-gray-600 hover:text-gray-900"
          >
            トップページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}

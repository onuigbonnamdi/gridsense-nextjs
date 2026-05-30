import { AuthGate } from "@/app/components/AuthGate";
import { Styles } from "@/app/components/Styles";

export default function Page() {
  return (
    <>
      <Styles />
      <AuthGate />
    </>
  );
}

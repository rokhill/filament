import useStore from "../store";
import useCurrentChain from "../hooks/useCurrentChain";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { ArrowUpCircleIcon, Loader2Icon, XIcon } from "lucide-react";
import { Button } from "./ui/button";

type Props = {
  txHash?: string;
  content?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const TransactionModal = ({ open, setOpen, txHash, content }: Props) => {
  const chain = useCurrentChain();
  const { loading } = useStore();

  return (
    <Dialog open={open}>
      <DialogContent hideCloseButton className="sm:max-w-[425px]">
        <DialogTitle className="sr-only">Transaction</DialogTitle>
        <DialogDescription className="sr-only">Transaction</DialogDescription>
        {loading ? (
          <>
            <div className="my-12 text-center">
              <Loader2Icon className="inline w-24 h-24 animate-spin" />
              <span className="sr-only">Loading...</span>
            </div>
            <div className="flex flex-col gap-3 mb-4 text-center">
              <p className="text-xl font-medium">Waiting for confirmation</p>
              <p className="break-all">{content}</p>
              <p className="text-sm text-muted-foreground">
                Confirm this transaction in your wallet
              </p>
            </div>
          </>
        ) : txHash ? (
          <>
            <div className="my-4 text-center" role="status">
              <ArrowUpCircleIcon className="inline w-24 h-24 stroke-1" />
            </div>
            <div className="flex flex-col gap-3 mb-4 text-center">
              <p className="text-xl font-medium">Transaction submitted</p>
              <Button
                type="button"
                className="w-full h-12"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
              <a
                href={`${chain.blockExplorers?.default.url}/tx/${txHash}`}
                target="_blank"
                className="font-medium text-primary hover:text-primary/80"
              >
                View on {chain.blockExplorers?.default.name}
              </a>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <div
                className="p-8 my-8 text-center text-red-500 border-2 border-red-500 rounded-full"
                role="status"
              >
                <XIcon className="inline w-16 h-16" />
              </div>
            </div>
            <div className="flex flex-col gap-6 mb-4 text-center">
              <p className="text-xl font-medium">
                Something went wrong, please try again
              </p>
              <Button
                type="button"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TransactionModal;

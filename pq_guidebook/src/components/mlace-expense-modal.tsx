import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useExpenseData } from '@/hooks/use-expense-data';
import { formatVND } from '@/lib/google-sheets-expense-fetcher';
import { Loader2 } from 'lucide-react';

interface MLACEExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MLACEExpenseModal({ open, onOpenChange }: MLACEExpenseModalProps) {
  const { data, loading, error, fetchData, reset } = useExpenseData();

  const handleClose = () => {
    onOpenChange(false);
    reset();
  };

  // Fetch data when modal opens
  useEffect(() => {
    if (open && !data) {
      fetchData();
    }
  }, [open, data, fetchData]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-xl text-cyan-400">📊 Chi tiêu team #mlace</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mr-3" />
              <span className="text-cream/80">Đang tải dữ liệu...</span>
            </div>
          )}

          {error && (
            <div className="text-red-400 py-8 text-center">
              ❌ {error}
            </div>
          )}

          {data && !loading && (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-cyan-950/30">
                    <TableHead className="w-16">STT</TableHead>
                    <TableHead>Nội dung chi</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                    <TableHead>Người chi</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Tiền/người</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item) => (
                    <TableRow key={item.stt}>
                      <TableCell className="font-medium">{item.stt}</TableCell>
                      <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                      <TableCell className="text-right font-semibold text-cyan-400">
                        {formatVND(item.amount)}
                      </TableCell>
                      <TableCell>{item.person}</TableCell>
                      <TableCell className="text-right hidden sm:table-cell text-cream/70">
                        {formatVND(item.perPerson)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-cyan-950/50 font-bold">
                    <TableCell colSpan={4} className="text-right pr-4">TỔNG CỘNG:</TableCell>
                    <TableCell className="text-right text-cyan-400 text-lg">
                      {formatVND(data.total)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

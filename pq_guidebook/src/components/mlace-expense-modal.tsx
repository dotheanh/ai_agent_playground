import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useExpenseData } from '@/hooks/use-expense-data';
import { formatVND, formatShort } from '@/lib/google-sheets-expense-fetcher';
import { Loader2 } from 'lucide-react';
import { Check, X } from 'lucide-react';

interface MLACEExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MEMBER_NAMES = ['Bình', 'Nhi', 'Tân', 'Thuận', 'Triển', 'Thế Anh', 'Vy'];
const MEMBER_KEYS = ['binh', 'nhi', 'tan', 'thuan', 'trieu', 'theAnh', 'vy'] as const;

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

  const getParticipationCell = (value?: boolean | number) => {
    if (value === true) {
      return <Check className="w-4 h-4 text-green-500" />;
    }
    if (value === false) {
      return <X className="w-4 h-4 text-gray-500" />;
    }
    if (typeof value === 'number' && value !== 0) {
      return <span className="text-cyan-400 font-medium">{formatShort(value)}</span>;
    }
    return <span className="text-gray-500">-</span>;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col bg-gray-900 border-cyan-500/30" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-xl text-cyan-400">📊 Chi tiêu team #mlace</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mr-3" />
              <span className="text-gray-300">Đang tải dữ liệu...</span>
            </div>
          )}

          {error && (
            <div className="text-red-400 py-8 text-center">
              ❌ {error}
            </div>
          )}

          {data && !loading && (
            <div className="space-y-6">
              {/* Transactions Table */}
              <div>
                <h3 className="text-lg font-semibold text-cyan-300 mb-3">📝 Danh sách chi tiêu</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-cyan-950/50 hover:bg-cyan-950/50">
                        <TableHead className="w-12 text-cyan-300">STT</TableHead>
                        <TableHead className="text-cyan-300">Nội dung chi</TableHead>
                        <TableHead className="text-right text-cyan-300">Số tiền</TableHead>
                        <TableHead className="text-cyan-300">Người chi</TableHead>
                        <TableHead className="text-right text-cyan-300">Số người</TableHead>
                        <TableHead className="text-right text-cyan-300">Tiền/người</TableHead>
                        {MEMBER_NAMES.map(member => (
                          <TableHead key={member} className="text-center text-cyan-300 hidden lg:table-cell">{member}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.items.map((item) => (
                        <TableRow key={item.stt} className="hover:bg-gray-800/50">
                          <TableCell className="font-medium text-gray-400">{item.stt}</TableCell>
                          <TableCell className="text-gray-200">{item.description}</TableCell>
                          <TableCell className="text-right font-semibold text-cyan-400">
                            {formatVND(item.amount)}
                          </TableCell>
                          <TableCell className="text-gray-300">{item.person}</TableCell>
                          <TableCell className="text-right text-gray-400">{item.count}</TableCell>
                          <TableCell className="text-right text-gray-400">
                            {formatVND(item.perPerson)}
                          </TableCell>
                          {MEMBER_KEYS.map((key) => (
                            <TableCell key={key} className="text-center hidden lg:table-cell">
                              {getParticipationCell((item as any)[key])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                      <TableRow className="bg-cyan-950/50 font-bold">
                        <TableCell colSpan={5} className="text-right pr-4 text-cyan-300">TỔNG CỘNG:</TableCell>
                        <TableCell className="text-right text-cyan-400 text-lg font-bold">
                          {formatVND(data.total)}
                        </TableCell>
                        {MEMBER_NAMES.map(() => (
                          <TableCell key={Math.random()} className="hidden lg:table-cell"></TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Member Summary Table */}
              <div>
                <h3 className="text-lg font-semibold text-cyan-300 mb-3">💰 Tổng hợp theo thành viên</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-cyan-950/50 hover:bg-cyan-950/50">
                        <TableHead className="text-cyan-300">Thành viên</TableHead>
                        <TableHead className="text-right text-cyan-300">Số tiền cuối phải trả</TableHead>
                        <TableHead className="text-right text-cyan-300">Số tiền đóng quỹ</TableHead>
                        <TableHead className="text-right text-cyan-300">Số tiền đã chi/ứng trước</TableHead>
                        <TableHead className="text-right text-cyan-300">Tổng chi phí</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.members.map((member, idx) => (
                        <TableRow key={member.name} className={idx % 2 === 0 ? 'bg-gray-800/30' : ''}>
                          <TableCell className="font-semibold text-cyan-300">{member.name}</TableCell>
                          <TableCell className="text-right text-gray-200">{formatVND(member.toPay)}</TableCell>
                          <TableCell className="text-right text-gray-400">{formatVND(member.fundContribution)}</TableCell>
                          <TableCell className="text-right text-gray-400">{formatVND(member.advancePayment)}</TableCell>
                          <TableCell className="text-right font-semibold text-cyan-400">{formatVND(member.totalExpense)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

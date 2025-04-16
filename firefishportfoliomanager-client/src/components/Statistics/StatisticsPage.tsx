import React from 'react';
import { useStatisticsService } from '../../services/statisticsService';
import { 
  Container, 
  Typography, 
  CircularProgress, 
  Alert, 
  Card, 
  CardContent, 
  Box 
} from '@mui/material';
import Grid from '@mui/material/Grid';
import PortfolioChart from './PortfolioChart'; // Import the new chart component
// import { fetchStatistics, ChartData, StatisticsSummary } from '../../services/statisticsService'; // Removed
// import { useAuth } from '../../context/AuthContext'; // Removed

const StatisticsPage: React.FC = () => {
  // Use the hook directly
  const { statisticsSummary, chartData, isLoading, error /*, refreshStatistics */ } = useStatisticsService();

  if (isLoading) { // Use isLoading from hook
    return (
      // <div className="flex justify-center items-center h-64"> // Replaced with MUI Box/CircularProgress
      //   <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    // <div className="container mx-auto px-4 py-8"> // Replaced with MUI Container
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* <h1 className="text-3xl font-bold mb-6">Statistics</h1> */}
      <Typography variant="h4" component="h1" gutterBottom>
        Statistics
      </Typography>

      {error && ( // Use error from hook
        // <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert"> // Replaced with MUI Alert
        //   <strong className="font-bold">Error!</strong>
        //   <span className="block sm:inline"> {error}</span>
        // </div>
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {/* Summary cards */}
      {statisticsSummary && ( // Use statisticsSummary from hook
        // <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"> // Replaced with MUI Grid
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Total Loans Card */}
          <Box sx={{ width: { xs: '100%', md: '33.33%' }, pr: { md: 1.5 }, pb: 3 }}>
            <Card>
              <CardContent>
                {/* <div className="text-sm font-medium text-gray-500 mb-1">Total Loans</div> */}
                <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                  Total Loans
                </Typography>
                {/* <div className="text-2xl font-bold">{summary.totalLoans}</div> */}
                <Typography variant="h5" component="div">
                  {statisticsSummary.totalLoans}
                </Typography>
                {/* <div className="text-sm text-gray-500 mt-2">
                  Active: {summary.activeLoansCzk.toLocaleString()} CZK
                </div> */}
                <Typography sx={{ mt: 1.5 }} color="text.secondary">
                  Active: {statisticsSummary.activeLoansCzk.toLocaleString()} CZK
                </Typography>
              </CardContent>
            </Card>
          </Box>
          
          {/* BTC Purchased Card */}
          <Box sx={{ width: { xs: '100%', md: '33.33%' }, px: { md: 1.5 }, pb: 3 }}>
            <Card>
              <CardContent>
                {/* <div className="text-sm font-medium text-gray-500 mb-1">BTC Purchased</div> */}
                <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                  BTC Purchased
                </Typography>
                {/* <div className="text-2xl font-bold">{summary.totalBtcPurchased.toFixed(4)} BTC</div> */}
                <Typography variant="h5" component="div">
                  {statisticsSummary.totalBtcPurchased.toFixed(4)} BTC
                </Typography>
                {/* <div className="text-sm text-gray-500 mt-2">
                  Remaining: {summary.totalBtcRemaining.toFixed(4)} BTC
                </div> */}
                <Typography sx={{ mt: 1.5 }} color="text.secondary">
                  Remaining: {statisticsSummary.totalBtcRemaining.toFixed(4)} BTC
                </Typography>
              </CardContent>
            </Card>
          </Box>
          
          {/* Total Profit Card */}
          <Box sx={{ width: { xs: '100%', md: '33.33%' }, pl: { md: 1.5 }, pb: 3 }}>
            <Card>
              <CardContent>
                {/* <div className="text-sm font-medium text-gray-500 mb-1">Total Profit</div> */}
                <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                  Total Profit
                </Typography>
                {/* <div className="text-2xl font-bold text-green-600">{summary.totalProfitCzk.toLocaleString()} CZK</div> */}
                <Typography variant="h5" component="div" sx={{ color: 'success.main' }}>
                  {statisticsSummary.totalProfitCzk.toLocaleString()} CZK
                </Typography>
                {/* <div className="text-sm text-gray-500 mt-2">
                  Avg. Return: {summary.averageProfitPercentage}%
                </div> */}
                <Typography sx={{ mt: 1.5 }} color="text.secondary">
                  Avg. Return: {statisticsSummary.averageProfitPercentage}%
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Grid>
        // </div>
      )}
      
      {/* Chart section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Portfolio Growth
          </Typography>
          
          {chartData ? (
            // Replace Box placeholder with the actual chart component
            <PortfolioChart data={chartData} />
          ) : (
            // Keep fallback message or add a loading state specific to the chart
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed grey' }}>
               <Typography color="text.secondary">No chart data available or still loading...</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* Performance metrics - Section was previously removed, remains removed */}
    </Container>
  );
};

export default StatisticsPage;

import java.util.Scanner;

public class LeftRotationPart2 {

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        // Input the number of elements in the array
        System.out.print("Enter the number of elements in the array: ");
        int n = scanner.nextInt();

        // Input the number of rotations to be performed
        System.out.print("Enter the number of left rotations: ");
        int d = scanner.nextInt();

        // Initialize the array
        int[] array = new int[n];

        // Input the elements of the array
        System.out.println("Enter the elements of the array:");
        for (int i = 0; i < n; i++) {
            array[i] = scanner.nextInt();
        }

        // Create an instance of LeftRotationPart1 to call the rotLeft function
        LeftRotationPart1 rotator = new LeftRotationPart1();
        int[] result = rotator.rotLeft(array, d);

        // Print the resulting array
        System.out.println("The array after " + d + " left rotations is:");
        System.out.println(Arrays.toString(result));

        scanner.close();
    }
}